/**
 * Subscribes to the BFF Server-Sent Events stream (`/api/auth/events`)
 * for the current authenticated user.
 *
 * The BFF route there is a thin proxy that fetches a Mercure subscriber
 * JWT from Symfony and pipes the upstream Mercure subscription back to
 * the browser as same-origin SSE. From this hook's perspective the wire
 * contract is unchanged: an `EventSource` listening for `acl-changed`
 * events whose `data` is `{ aclVersion: string }`.
 *
 * When the backend reports an `acl-changed` event (group/role mutation,
 * async job grant, admin role change, etc.), this hook invalidates
 * `['user-data']`. That refetch picks up the new `aclVersion`, which the
 * existing `useAclVersionWatcher` then turns into surgical invalidations
 * of `['frontend-pages']`, `['admin-pages']`, and `['page-by-keyword']`.
 *
 * Result: the public navigation, the admin sidebar, and any
 * permission-gated page content all refresh **without a click** and
 * within a few hundred milliseconds of the backend mutation — even when
 * the trigger was an async background job rather than the user's own
 * request.
 *
 * Mount once at the root of the client tree (`ClientProviders`).
 *
 * The hook is a no-op on the server (`EventSource` is a browser API)
 * and for anonymous visitors (no `sh_auth` cookie → no events to
 * listen for).
 */

'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStatus } from './useUserData';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

const SSE_ENDPOINT = '/api/auth/events';
/** Max backoff between reconnection attempts after repeated failures. */
const MAX_RECONNECT_DELAY_MS = 30_000;
/** Initial backoff — doubles on each successive failure. */
const INITIAL_RECONNECT_DELAY_MS = 1_000;

export function useAclEventStream(): void {
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuthStatus();

    useEffect(() => {
        if (!isAuthenticated) return;
        if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

        let es: EventSource | null = null;
        let reconnectTimer: number | null = null;
        let reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
        let cancelled = false;

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

            // The browser auto-reconnects on transient errors, but if the
            // upstream returns 4xx (e.g. expired JWT) it stays closed.
            // Re-open with backoff so the user does not silently lose
            // permission updates.
            es.addEventListener('error', () => {
                if (!es) return;
                if (es.readyState === EventSource.CLOSED && !cancelled) {
                    es.close();
                    es = null;
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
    }, [isAuthenticated, queryClient]);
}
