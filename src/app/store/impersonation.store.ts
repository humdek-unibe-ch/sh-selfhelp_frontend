/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { create } from 'zustand';
import { IMPERSONATE_TARGET_EMAIL_COOKIE } from '../../config/cookie-names';
import { readCookieValue } from '../../utils/auth.utils';

/**
 * Reactive impersonation state.
 *
 * The actual JWT (`sh_impersonate`) is httpOnly — JavaScript cannot see
 * it. To draw the "You are impersonating ..." banner the browser only
 * needs the *target email*, which lives in the matching non-httpOnly
 * cookie `sh_impersonate_target_email` set by the BFF route.
 *
 * ## How updates reach the store
 *
 *   1. **Initial mount** — `bootImpersonationStore()` reads the cookie
 *      once when the React tree mounts. Handles page reload during an
 *      active impersonation session.
 *   2. **`active: true`** — `useImpersonateUser` calls `setActive()`
 *      directly after the BFF mutation resolves. Banner shows
 *      immediately, no waiting for round-trips.
 *   3. **`active: false`** — three independent paths, any one of which
 *      is enough:
 *        - **Mercure push** (`impersonation-status` event with
 *           `active: false`). Cross-tab and cross-device — clicking
 *           "Stop" in one tab clears the banner in every other open
 *           tab within milliseconds.
 *        - **TTL safety-net** (`setTimeout(expires_in_ms)`). Belt-and-
 *           braces: if the Mercure connection is unhealthy, the banner
 *           still disappears the moment the JWT was due to expire, so
 *           the UI can never lie to the user about their effective
 *           identity for longer than the JWT lifetime.
 *        - **Manual stop** — `useStopImpersonate` calls `clear()`
 *           directly on success.
 *
 * No polling. The previous 5-second `setInterval` is gone — we now have
 * a real push channel for the only state transition that the browser
 * cannot trigger itself ("server / other tab said stop").
 */
interface ImpersonationState {
    isImpersonating: boolean;
    targetEmail: string | null;
    /**
     * Unix-ms timestamp at which the impersonation JWT will expire.
     * `null` outside an active session. Used by the TTL setTimeout to
     * fire `clear()` proactively, and by tests to assert the timeout
     * was scheduled.
     */
    expiresAtMs: number | null;
    /** Move the store into the "impersonating" state. */
    setActive: (params: { targetEmail: string; expiresInSec?: number }) => void;
    /** Clear the impersonation state. Idempotent. */
    clear: () => void;
    /**
     * Re-read the cookie and update the store. Used at boot and on
     * `visibilitychange` so a tab that was sleeping during a stop
     * event still picks up the cleared cookie when it wakes.
     */
    refresh: () => void;
}

function readEmailFromCookie(): string | null {
    return readCookieValue(IMPERSONATE_TARGET_EMAIL_COOKIE);
}

let _ttlTimer: ReturnType<typeof setTimeout> | null = null;
function clearTtlTimer(): void {
    if (_ttlTimer !== null) {
        clearTimeout(_ttlTimer);
        _ttlTimer = null;
    }
}

export const useImpersonationStore = create<ImpersonationState>((set, get) => ({
    isImpersonating: false,
    targetEmail: null,
    expiresAtMs: null,
    setActive: ({ targetEmail, expiresInSec }) => {
        clearTtlTimer();

        const expiresAtMs =
            typeof expiresInSec === 'number' && expiresInSec > 0
                ? Date.now() + expiresInSec * 1000
                : null;

        set({
            isImpersonating: true,
            targetEmail,
            expiresAtMs,
        });

        // Schedule the local fallback. If a Mercure `active: false` event
        // beats the timer, `clear()` cancels the timer and we no-op
        // gracefully. If neither happens (offline tab) the timer fires
        // the moment the JWT is no longer accepted by Symfony anyway,
        // so the banner state matches reality at the millisecond.
        if (expiresAtMs !== null) {
            const delay = Math.max(0, expiresAtMs - Date.now());
            _ttlTimer = setTimeout(() => {
                _ttlTimer = null;
                get().clear();
            }, delay);
        }
    },
    clear: () => {
        clearTtlTimer();
        set({
            isImpersonating: false,
            targetEmail: null,
            expiresAtMs: null,
        });
    },
    refresh: () => {
        const email = readEmailFromCookie();
        if (email) {
            // Re-hydrating from cookie at mount: we don't know the
            // remaining TTL precisely, so don't (re-)arm the timer.
            // The next Mercure event or the next API 401 will correct
            // us; in the meantime the banner shows accurately.
            set({
                isImpersonating: true,
                targetEmail: email,
            });
        } else {
            get().clear();
        }
    },
}));

/**
 * Mount-time bootstrap: hydrate the store from the cookie and refresh
 * on tab refocus so a tab that was asleep during a stop event picks
 * up the cleared cookie when it comes back.
 *
 * No polling — the Mercure SSE stream is our push channel for the
 * `stop` transition; all other transitions are triggered by code in
 * this same JS context (mutations call `setActive`/`clear` directly).
 */
let _booted = false;
export function bootImpersonationStore(): void {
    if (typeof window === 'undefined' || _booted) return;
    _booted = true;

    useImpersonationStore.getState().refresh();

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            useImpersonationStore.getState().refresh();
        }
    });
}
