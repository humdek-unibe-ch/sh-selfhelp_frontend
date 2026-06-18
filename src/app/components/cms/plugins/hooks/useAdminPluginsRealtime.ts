/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Subscribes the admin plugin manager UI to the BFF Server-Sent Events
 * stream at `/api/plugins/events`. The BFF route multiplexes every
 * plugin topic IRI the backend grants the current user, including the
 * admin plugin state topic dispatched by
 * `App\EventListener\PluginStateMercurePublisher`.
 *
 * On any of the plugin lifecycle / progress events listed below the
 * hook invalidates the admin React Query caches so the UI repaints
 * from a fresh fetch — no polling, no manual refresh.
 *
 * Events handled (must match the SSE `event:` names emitted by
 * `PluginStateMercurePublisher::publish()`):
 *
 *   - `plugin-installed`
 *   - `plugin-enabled`
 *   - `plugin-disabled`
 *   - `plugin-updated`
 *   - `plugin-uninstalled`
 *   - `plugin-purged`
 *   - `plugin-operation-progress`
 *
 * Mounted alongside `useAclEventStream` in `RefineWrapper` so the SSE
 * connection is opened for every authenticated session; users without
 * the `admin.plugins.manage` permission receive zero plugin topics and
 * the BFF returns 204 — no retry storm, no overhead.
 *
 * The hook is a no-op on the server (`EventSource` is browser-only)
 * and for anonymous visitors.
 */

'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStatus } from '../../../../../hooks/useUserData';
import { REACT_QUERY_CONFIG } from '../../../../../config/react-query.config';
import { setPluginSseConnected } from './plugin-sse-status';

const SSE_ENDPOINT = '/api/plugins/events';
const MAX_RECONNECT_DELAY_MS = 30_000;
const INITIAL_RECONNECT_DELAY_MS = 1_000;

const ADMIN_PLUGINS_KEY = ['admin-plugins'] as const;
const ADMIN_PLUGINS_AVAILABLE_KEY = ['admin-plugins', 'available'] as const;
const ADMIN_PLUGIN_OPERATIONS_KEY = ['admin-plugin-operations'] as const;
const PLUGINS_MANIFEST_KEY = ['plugins-manifest'] as const;

const PLUGIN_STATE_EVENTS = [
    'plugin-installed',
    'plugin-enabled',
    'plugin-disabled',
    'plugin-updated',
    'plugin-uninstalled',
    'plugin-purged',
] as const;

export function useAdminPluginsRealtime(): void {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { isAuthenticated } = useAuthStatus();

    useEffect(() => {
        if (!isAuthenticated) return undefined;
        if (typeof window === 'undefined' || typeof EventSource === 'undefined') return undefined;

        let es: EventSource | null = null;
        let reconnectTimer: number | null = null;
        let reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
        let cancelled = false;
        // Distinguishes the first successful connect (SSR already provided
        // fresh data) from a RE-connect after a drop (where events were likely
        // missed — e.g. the manager restarted Symfony for a plugin/system
        // operation — and the UI must reconcile).
        let hasConnectedBefore = false;

        const invalidatePluginSurfaceCaches = () => {
            void queryClient.invalidateQueries({ queryKey: ADMIN_PLUGINS_KEY });
            void queryClient.invalidateQueries({ queryKey: ADMIN_PLUGINS_AVAILABLE_KEY });
            void queryClient.invalidateQueries({ queryKey: ADMIN_PLUGIN_OPERATIONS_KEY });
            void queryClient.invalidateQueries({ queryKey: PLUGINS_MANIFEST_KEY });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FRONTEND_PAGES_ALL });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.STYLE_GROUPS });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.LOOKUPS });

            // Plugin lifecycle changes can remove styles/admin pages that
            // are already part of the current App Router payload. A route
            // refresh forces a fresh RSC tree so stale sections do not
            // linger until the next manual navigation.
            router.refresh();
        };

        const invalidateOperationsOnly = () => {
            void queryClient.invalidateQueries({ queryKey: ADMIN_PLUGIN_OPERATIONS_KEY });
        };

        const connect = () => {
            if (cancelled) return;
            try {
                es = new EventSource(SSE_ENDPOINT);
            } catch {
                return;
            }

            es.addEventListener('open', () => {
                reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
                // SSE is live → stop any fallback polling.
                setPluginSseConnected(true);
                // On a RE-connect, reconcile state that may have changed while
                // the stream was down (the whole point of dropping the timer
                // poll): one full invalidation brings the UI back in sync.
                if (hasConnectedBefore) {
                    invalidatePluginSurfaceCaches();
                }
                hasConnectedBefore = true;
            });

            for (const eventName of PLUGIN_STATE_EVENTS) {
                es.addEventListener(eventName, invalidatePluginSurfaceCaches);
            }

            // Progress events are noisy — only invalidate the
            // operations list so the install/update detail view picks
            // up new log lines without thrashing the plugins list.
            es.addEventListener('plugin-operation-progress', invalidateOperationsOnly);

            es.addEventListener('error', () => {
                if (!es) return;
                // The stream dropped → allow the fallback poll to take over
                // while an operation is in flight.
                setPluginSseConnected(false);
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
            setPluginSseConnected(false);
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
