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
 * ## One connection per BROWSER, not per tab
 *
 * Like {@link useAclEventStream}, the real `EventSource` is owned by
 * {@link subscribeSharedSse}: a single leader tab holds the connection for the
 * whole browser and fans events out to the others over a `BroadcastChannel`.
 * This is what stops every admin tab from holding a SECOND permanent SSE (this
 * one) on top of the ACL stream and exhausting the browser's per-origin
 * connection pool. See `src/utils/shared-sse.ts`.
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
import { subscribeSharedSse } from '../../../../../utils/shared-sse';

const SSE_ENDPOINT = '/api/plugins/events';

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

const PLUGIN_PROGRESS_EVENT = 'plugin-operation-progress';

/** Every named event the stream forwards. */
const PLUGIN_STREAM_EVENTS = [...PLUGIN_STATE_EVENTS, PLUGIN_PROGRESS_EVENT] as const;

export function useAdminPluginsRealtime(): void {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { isAuthenticated } = useAuthStatus();

    useEffect(() => {
        if (!isAuthenticated) return undefined;

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

        // Lighter reconcile for a tab regaining visibility: refresh the plugin
        // data without forcing a full RSC `router.refresh()` on every focus.
        const reconcilePluginQueries = () => {
            void queryClient.invalidateQueries({ queryKey: ADMIN_PLUGINS_KEY });
            void queryClient.invalidateQueries({ queryKey: ADMIN_PLUGIN_OPERATIONS_KEY });
        };

        const unsubscribe = subscribeSharedSse({
            endpoint: SSE_ENDPOINT,
            events: PLUGIN_STREAM_EVENTS,
            onEvent: (type) => {
                // Progress events are noisy — only invalidate the operations
                // list so the install/update detail view picks up new log lines
                // without thrashing the plugins list.
                if (type === PLUGIN_PROGRESS_EVENT) {
                    invalidateOperationsOnly();
                } else {
                    invalidatePluginSurfaceCaches();
                }
            },
            onStatus: (connected) => setPluginSseConnected(connected),
            // Reconnected after a drop (e.g. the manager restarted Symfony for a
            // plugin/system operation): events were likely missed, so reconcile.
            onReopen: invalidatePluginSurfaceCaches,
            onResume: reconcilePluginQueries,
        });

        return () => {
            setPluginSseConnected(false);
            unsubscribe();
        };
    }, [isAuthenticated, queryClient, router]);
}
