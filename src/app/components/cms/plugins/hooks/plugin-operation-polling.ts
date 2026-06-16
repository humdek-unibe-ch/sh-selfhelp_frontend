/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Adaptive polling for the admin plugin manager.
 *
 * Plugin lifecycle status is normally pushed over Mercure SSE
 * (`useAdminPluginsRealtime`), and every React Query cache uses
 * `staleTime: Infinity` with NO background polling. That is efficient
 * when SSE works — but SSE can stall silently (proxy hiccup, dropped
 * `EventSource`, a sleeping laptop), and then a missed event freezes the
 * UI in the middle of an install / update / uninstall: the operation is
 * progressing on the server but the admin sees nothing change. This is
 * the "status tracking is unreliable" symptom.
 *
 * The helpers here add a belt-and-suspenders fallback that complements
 * Mercure instead of replacing it. Per the operator-chosen policy the
 * fallback poll runs ONLY when BOTH conditions hold:
 *
 *   - the SSE stream is currently DISCONNECTED (see `plugin-sse-status`);
 *     while SSE is live we trust it and never poll, and
 *   - at least one plugin operation is in a non-terminal state
 *     (`requested` / `running`).
 *
 * The moment SSE reconnects the poll stops (and `useAdminPluginsRealtime`
 * runs one full invalidation to reconcile anything missed). When nothing is
 * happening there is no background traffic at all.
 */

import type { IAdminPluginOperation } from '../../../../../types/responses/admin/plugins.types';

/**
 * Poll interval (ms) used while a plugin operation is in flight. Short
 * enough to feel live, long enough not to hammer the BFF for a
 * minutes-long composer install.
 */
export const PLUGIN_OPERATION_ACTIVE_POLL_MS = 2_000;

/**
 * Non-terminal operation statuses. Everything else (`succeeded`,
 * `failed`, `cancelled`, `rolled_back`) is terminal and needs no
 * polling.
 */
const ACTIVE_STATUSES: ReadonlySet<string> = new Set<IAdminPluginOperation['status']>([
    'requested',
    'running',
]);

/** Whether a single operation status is still in flight. */
export function isPluginOperationActive(status: string | null | undefined): boolean {
    return typeof status === 'string' && ACTIVE_STATUSES.has(status);
}

/** Whether a list of operations contains at least one in-flight operation. */
export function hasActivePluginOperation(
    operations: readonly IAdminPluginOperation[] | null | undefined,
): boolean {
    return Array.isArray(operations) && operations.some((op) => isPluginOperationActive(op?.status));
}

/**
 * The in-flight operation for ONE plugin, or null. This is the authoritative,
 * backend-driven busy signal for a row's action button: it survives polling
 * refetches AND a full page reload (unlike a local "request in flight" flag),
 * so the button stays in its progress state for the whole background worker run
 * and can never be clicked again mid-operation.
 */
export function activePluginOperationFor(
    operations: readonly IAdminPluginOperation[] | null | undefined,
    pluginId: string,
): IAdminPluginOperation | null {
    if (!Array.isArray(operations)) return null;
    return (
        operations.find((op) => op?.pluginId === pluginId && isPluginOperationActive(op?.status)) ?? null
    );
}

/**
 * Present-progressive button label for an in-flight operation type, e.g.
 * `install` → "Installing…". Keeps the action button honest about WHICH
 * lifecycle step is running instead of a generic spinner.
 */
export function pluginOperationBusyLabel(type: IAdminPluginOperation['type']): string {
    switch (type) {
        case 'install':
            return 'Installing…';
        case 'update':
            return 'Updating…';
        case 'uninstall':
            return 'Uninstalling…';
        case 'purge':
            return 'Purging…';
        case 'enable':
            return 'Enabling…';
        case 'disable':
            return 'Disabling…';
        case 'rollback':
            return 'Rolling back…';
        case 'repair':
            return 'Repairing…';
        default:
            return 'Working…';
    }
}

/**
 * `refetchInterval` value for the operations query itself: poll fast ONLY
 * while SSE is disconnected AND it carries an in-flight operation; otherwise
 * stop. Pass the query's own `data` (`query.state.data`) and the live SSE
 * connection state from `usePluginSseConnected()`.
 */
export function operationsRefetchInterval(
    operations: readonly IAdminPluginOperation[] | null | undefined,
    sseConnected: boolean,
): number | false {
    if (sseConnected) return false;
    return hasActivePluginOperation(operations) ? PLUGIN_OPERATION_ACTIVE_POLL_MS : false;
}

/**
 * `refetchInterval` value for the plugin list / detail / available
 * queries. They have no operation field of their own, so they piggyback
 * on whether an operation is currently in flight (derived from the
 * operations query they subscribe to). Polls ONLY while SSE is disconnected
 * AND an operation is active.
 */
export function pluginSurfaceRefetchInterval(
    hasActiveOperation: boolean,
    sseConnected: boolean,
): number | false {
    if (sseConnected) return false;
    return hasActiveOperation ? PLUGIN_OPERATION_ACTIVE_POLL_MS : false;
}
