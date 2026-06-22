/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Cross-tab auth synchronisation over a same-origin `BroadcastChannel`.
 *
 * ## Why
 *
 * Auth lives in httpOnly cookies that the BFF sets/clears. Those cookies are
 * shared by every tab of the SAME browser, so when one tab logs out the
 * cookies are gone for all of them — but the OTHER tabs don't *notice*: their
 * `['user-data']` React Query cache still holds the user and their auth-events
 * SSE stays open (the Mercure hub doesn't know about the logout). They only
 * discover it lazily on the next 401, which is the "I logged out in one tab but
 * the others still show me as logged in" report.
 *
 * A `BroadcastChannel` lets the acting tab tell its siblings about an auth
 * transition the instant it happens, so they clear/refresh immediately. This is
 * deliberately scoped to ONE browser: a `BroadcastChannel` never crosses
 * browsers, devices, or the mobile app, so logging out on the web does NOT sign
 * you out on your phone or in another browser — exactly the per-browser
 * behaviour we want. Logout stays per-session on the backend (it only blacklists
 * the acting session's tokens); this purely propagates the *detection* of that
 * logout to the acting browser's own tabs.
 *
 * No-ops on the server and where `BroadcastChannel` is unavailable (older
 * browsers, jsdom) so callers never need to guard.
 */
'use client';

/** Auth transitions worth broadcasting to sibling tabs. */
export type AuthBroadcastMessage = { type: 'logged-out' } | { type: 'logged-in' };

const CHANNEL_NAME = 'selfhelp-auth';

let channel: BroadcastChannel | null = null;

/**
 * Lazily create (once per tab) the shared channel. Using a single module-level
 * instance for BOTH posting and listening means the spec guarantees a tab never
 * receives its OWN message — only sibling tabs do — so the acting tab keeps
 * owning its redirect while siblings react independently.
 */
function getChannel(): BroadcastChannel | null {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
        return null;
    }
    if (!channel) {
        channel = new BroadcastChannel(CHANNEL_NAME);
    }
    return channel;
}

/** Tell sibling tabs in this browser that the auth state changed. */
export function broadcastAuthChange(message: AuthBroadcastMessage): void {
    try {
        getChannel()?.postMessage(message);
    } catch {
        // Channel closed / unsupported — cross-tab sync is best-effort.
    }
}

/**
 * Subscribe to auth transitions from sibling tabs. Returns an unsubscribe
 * function (or a no-op when `BroadcastChannel` is unavailable).
 */
export function subscribeAuthBroadcast(
    handler: (message: AuthBroadcastMessage) => void
): () => void {
    const ch = getChannel();
    if (!ch) {
        return () => {};
    }
    const listener = (event: MessageEvent): void => {
        const data = event.data as AuthBroadcastMessage | undefined;
        if (data && (data.type === 'logged-out' || data.type === 'logged-in')) {
            handler(data);
        }
    };
    ch.addEventListener('message', listener);
    return () => ch.removeEventListener('message', listener);
}
