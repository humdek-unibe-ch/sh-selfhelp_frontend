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
/** Max backoff between reconnection attempts after repeated failures. */
const MAX_RECONNECT_DELAY_MS = 30_000;
/** Initial backoff — doubles on each successive failure. */
const INITIAL_RECONNECT_DELAY_MS = 1_000;

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
        if (!isAuthenticated) return;
        if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

        let es: EventSource | null = null;
        let reconnectTimer: number | null = null;
        let reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
        let cancelled = false;
        let checkingAuth = false;

        const handleExpiredSession = async (): Promise<boolean> => {
            if (checkingAuth || cancelled) return false;
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

        const connect = () => {
            if (cancelled) return;
            try {
                es = new EventSource(SSE_ENDPOINT);
            } catch {
                // EventSource constructor never normally throws, but if
                // the browser lacks support we silently no-op.
                return;
            }

            es.addEventListener('open', () => {
                // Successful handshake — reset backoff so the next
                // disconnection starts retrying quickly again.
                reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
            });

            es.addEventListener('acl-changed', () => {
                // Invalidating user-data is enough: `useAclVersionWatcher`
                // will detect the bumped `aclVersion` after the refetch
                // and cascade the navigation / admin / page caches.
                queryClient.invalidateQueries({
                    queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA,
                });
            });

            es.addEventListener('impersonation-status', (evt) => {
                const payload = parseImpersonationStatus(
                    (evt as MessageEvent<string>).data
                );
                if (payload === null) return;

                const store = useImpersonationStore.getState();
                if (payload.active) {
                    if (typeof payload.targetEmail !== 'string') return;
                    store.setActive({
                        targetEmail: payload.targetEmail,
                        expiresInSec:
                            typeof payload.expiresIn === 'number'
                                ? payload.expiresIn
                                : undefined,
                    });
                } else {
                    // Either the target's session, the impersonating
                    // session, or another tab of either side — they all
                    // share this topic and must clear in lock-step.
                    store.clear();
                }
            });

            // The browser auto-reconnects on transient errors, but if the
            // upstream returns 4xx (e.g. expired JWT) it stays closed.
            // Re-open with backoff so the user does not silently lose
            // permission updates.
            es.addEventListener('error', async () => {
                if (!es) return;
                if (es.readyState === EventSource.CLOSED && !cancelled) {
                    es.close();
                    es = null;
                    const expired = await handleExpiredSession();
                    if (expired || cancelled) {
                        return;
                    }
                    reconnectTimer = window.setTimeout(connect, reconnectDelay);
                    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
                }
            });
        };

        connect();

        return () => {
            cancelled = true;
            if (reconnectTimer !== null) {
                window.clearTimeout(reconnectTimer);
            }
            if (es) {
                es.close();
                es = null;
            }
        };
    }, [isAuthenticated, queryClient, router]);
}
