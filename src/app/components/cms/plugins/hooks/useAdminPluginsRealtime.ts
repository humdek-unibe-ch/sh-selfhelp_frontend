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
import { useAuthStatus } from '../../../../../hooks/useUserData';

const SSE_ENDPOINT = '/api/plugins/events';
const MAX_RECONNECT_DELAY_MS = 30_000;
const INITIAL_RECONNECT_DELAY_MS = 1_000;

const ADMIN_PLUGINS_KEY = ['admin-plugins'] as const;
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
    const { isAuthenticated } = useAuthStatus();

    useEffect(() => {
        if (!isAuthenticated) return;
        if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

        let es: EventSource | null = null;
        let reconnectTimer: number | null = null;
        let reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
        let cancelled = false;

        const invalidateAdminCaches = () => {
            queryClient.invalidateQueries({ queryKey: ADMIN_PLUGINS_KEY });
            queryClient.invalidateQueries({ queryKey: ADMIN_PLUGIN_OPERATIONS_KEY });
            queryClient.invalidateQueries({ queryKey: PLUGINS_MANIFEST_KEY });
        };

        const invalidateOperationsOnly = () => {
            queryClient.invalidateQueries({ queryKey: ADMIN_PLUGIN_OPERATIONS_KEY });
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
            });

            for (const eventName of PLUGIN_STATE_EVENTS) {
                es.addEventListener(eventName, invalidateAdminCaches);
            }

            // Progress events are noisy — only invalidate the
            // operations list so the install/update detail view picks
            // up new log lines without thrashing the plugins list.
            es.addEventListener('plugin-operation-progress', invalidateOperationsOnly);

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
