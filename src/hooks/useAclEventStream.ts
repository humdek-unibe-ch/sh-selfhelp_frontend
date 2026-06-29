/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Subscribes to the BFF Server-Sent Events stream (`/api/auth/events`)
 * for the current authenticated user.
 *
 * The BFF route there is a thin proxy that fetches a Mercure subscriber
 * JWT from Symfony and pipes the upstream Mercure subscription back to
 * the browser as same-origin SSE. The single connection multiplexes two
 * event types — `acl-changed` and `impersonation-status` — over a
 * single Mercure JWT scoped to two topics on one upstream socket.
 *
 * ## One connection per BROWSER, not per tab
 *
 * The actual `EventSource` is owned by {@link subscribeSharedSse}: across all
 * tabs of the browser exactly ONE leader tab holds the network connection and
 * fans every event out to the others over a `BroadcastChannel`. This hook only
 * supplies the cache-invalidation callbacks, so opening many tabs no longer
 * stacks SSE connections and exhausts the browser's per-origin pool (the cause
 * of the "Data Browser hangs once I have a few tabs open" report). See
 * `src/utils/shared-sse.ts`.
 *
 * ## Events handled
 *
 *   - **`acl-changed`** — `data: { aclVersion: string }`. Fired when
 *     the user's ACL membership changes (group/role mutation, async
 *     job grant, admin role change, etc.). Invalidates `['user-data']`;
 *     the refetch picks up the new `aclVersion`, which
 *     `useAclVersionWatcher` then cascades into surgical invalidations
 *     of `['frontend-pages']`, `['admin-pages']`, and `['page-by-keyword']`.
 *   - **`impersonation-status`** — `data: { active: boolean,
 *     targetEmail?: string, targetUserId: number, adminUserId: number,
 *     expiresAt?: number, expiresIn?: number }`. Fired when an admin
 *     starts (`active: true`) or stops (`active: false`) impersonating
 *     this user. Drives the `useImpersonationStore` so the banner
 *     reacts in real time across tabs and devices, replacing the
 *     previous 5-second cookie poll.
 *
 * Result: the public navigation, the admin sidebar, permission-gated
 * page content AND the impersonation banner all refresh **without a
 * click** and within a few hundred milliseconds of the backend
 * mutation — even when the trigger was an async background job or a
 * stop click in a different browser tab.
 *
 * Mount once at the root of the client tree (`ClientProviders`).
 *
 * The hook is a no-op on the server (`EventSource` is a browser API)
 * and for anonymous visitors (no `sh_auth` cookie → no events to
 * listen for).
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStatus } from './useUserData';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useImpersonationStore } from '../app/store/impersonation.store';
import { ROUTES } from '../config/routes.config';
import { setAuthSseConnected } from './auth-sse-status';
import { subscribeSharedSse } from '../utils/shared-sse';

/** React Query keys for the system-update views fed by the `system-update` SSE event. */
const SYSTEM_UPDATE_STATUS_KEY = ['systemUpdateStatus'] as const;
const SYSTEM_VERSION_KEY = ['systemVersion'] as const;
const SYSTEM_HEALTH_KEY = ['systemHealth'] as const;

interface ImpersonationStatusPayload {
    active: boolean;
    targetEmail?: string;
    targetUserId?: number;
    adminUserId?: number;
    expiresAt?: number;
    expiresIn?: number;
}

function parseImpersonationStatus(raw: string): ImpersonationStatusPayload | null {
    try {
        const data = JSON.parse(raw) as unknown;
        if (typeof data !== 'object' || data === null) return null;
        const { active } = data as { active?: unknown };
        if (typeof active !== 'boolean') return null;
        return data as ImpersonationStatusPayload;
    } catch {
        return null;
    }
}

const SSE_ENDPOINT = '/api/auth/events';

/** Named events this stream forwards (must match the BFF / Mercure `event:` names). */
const ACL_STREAM_EVENTS = ['acl-changed', 'impersonation-status', 'system-update'] as const;

function shouldRedirectToLogin(pathname: string): boolean {
    if (!pathname.startsWith('/admin')) return false;
    if (pathname.startsWith(ROUTES.LOGIN)) return false;
    if (pathname.startsWith(ROUTES.NO_ACCESS)) return false;
    return true;
}

export function useAclEventStream(): void {
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuthStatus();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) return undefined;

        let checkingAuth = false;

        const invalidateSystemUpdate = () => {
            void queryClient.invalidateQueries({ queryKey: SYSTEM_UPDATE_STATUS_KEY });
            void queryClient.invalidateQueries({ queryKey: SYSTEM_VERSION_KEY });
            void queryClient.invalidateQueries({ queryKey: SYSTEM_HEALTH_KEY });
        };

        // Returns true when the session is genuinely gone (so the shared stream
        // should stop reconnecting); false otherwise. Shared by the leader tab
        // (via `onLeaderClosed`) and follower tabs (via `onSessionExpired`).
        const handleExpiredSession = async (): Promise<boolean> => {
            if (checkingAuth) return false;
            checkingAuth = true;
            try {
                const res = await fetch('/api/auth/user-data', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                        'X-Client-Type': 'web',
                    },
                    cache: 'no-store',
                });

                if (res.status !== 401) {
                    return false;
                }

                queryClient.removeQueries({
                    queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA,
                });

                const currentPath = window.location.pathname + window.location.search;
                if (shouldRedirectToLogin(window.location.pathname)) {
                    router.replace(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(currentPath)}`);
                }
                return true;
            } catch {
                return false;
            } finally {
                checkingAuth = false;
            }
        };

        const handleImpersonation = (raw: string) => {
            const payload = parseImpersonationStatus(raw);
            if (payload === null) return;

            const store = useImpersonationStore.getState();
            if (payload.active) {
                if (typeof payload.targetEmail !== 'string') return;
                store.setActive({
                    targetEmail: payload.targetEmail,
                    expiresInSec:
                        typeof payload.expiresIn === 'number' ? payload.expiresIn : undefined,
                });
            } else {
                // Either the target's session, the impersonating session, or
                // another tab of either side — they all share this topic and
                // must clear in lock-step.
                store.clear();
            }
        };

        const unsubscribe = subscribeSharedSse({
            endpoint: SSE_ENDPOINT,
            events: ACL_STREAM_EVENTS,
            onEvent: (type, data) => {
                if (type === 'acl-changed') {
                    // Invalidating user-data is enough: `useAclVersionWatcher`
                    // will detect the bumped `aclVersion` after the refetch and
                    // cascade the navigation / admin / page caches.
                    void queryClient.invalidateQueries({
                        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA,
                    });
                } else if (type === 'impersonation-status') {
                    handleImpersonation(data);
                } else if (type === 'system-update') {
                    invalidateSystemUpdate();
                }
            },
            onStatus: (connected) => setAuthSseConnected(connected),
            // Reconnected after a drop / tab became visible again: reconcile the
            // system-update view that may have moved while we weren't listening.
            onReopen: invalidateSystemUpdate,
            onResume: invalidateSystemUpdate,
            onLeaderClosed: handleExpiredSession,
            onSessionExpired: () => {
                void handleExpiredSession();
            },
        });

        return () => {
            setAuthSseConnected(false);
            unsubscribe();
        };
    }, [isAuthenticated, queryClient, router]);
}
