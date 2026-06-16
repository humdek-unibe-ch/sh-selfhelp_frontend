/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { describe, expect, it } from 'vitest';
import type { IAdminPluginOperation } from '../../../../../../types/responses/admin/plugins.types';
import {
    PLUGIN_OPERATION_ACTIVE_POLL_MS,
    activePluginOperationFor,
    hasActivePluginOperation,
    isPluginOperationActive,
    operationsRefetchInterval,
    pluginOperationBusyLabel,
    pluginSurfaceRefetchInterval,
} from '../plugin-operation-polling';

function op(status: IAdminPluginOperation['status']): IAdminPluginOperation {
    return opFor('qa-plugin', status);
}

function opFor(
    pluginId: string,
    status: IAdminPluginOperation['status'],
    type: IAdminPluginOperation['type'] = 'install',
): IAdminPluginOperation {
    return {
        id: 1,
        pluginId,
        type,
        status,
        installMode: 'managed',
        createdAt: '2026-06-15T00:00:00Z',
    };
}

describe('plugin operation adaptive polling', () => {
    describe('isPluginOperationActive', () => {
        it('treats requested and running as in-flight', () => {
            expect(isPluginOperationActive('requested')).toBe(true);
            expect(isPluginOperationActive('running')).toBe(true);
        });

        it('treats every terminal status as not in-flight', () => {
            for (const status of ['succeeded', 'failed', 'cancelled', 'rolled_back'] as const) {
                expect(isPluginOperationActive(status)).toBe(false);
            }
        });

        it('is safe for missing/unknown status values', () => {
            expect(isPluginOperationActive(undefined)).toBe(false);
            expect(isPluginOperationActive(null)).toBe(false);
            expect(isPluginOperationActive('')).toBe(false);
            expect(isPluginOperationActive('bogus')).toBe(false);
        });
    });

    describe('hasActivePluginOperation', () => {
        it('is true when any operation in the list is in flight', () => {
            expect(hasActivePluginOperation([op('succeeded'), op('running')])).toBe(true);
        });

        it('is false when every operation is terminal', () => {
            expect(hasActivePluginOperation([op('succeeded'), op('failed')])).toBe(false);
        });

        it('is false for empty / missing data', () => {
            expect(hasActivePluginOperation([])).toBe(false);
            expect(hasActivePluginOperation(undefined)).toBe(false);
            expect(hasActivePluginOperation(null)).toBe(false);
        });
    });

    describe('activePluginOperationFor', () => {
        it('returns the in-flight operation for the requested plugin only', () => {
            const a = opFor('plugin-a', 'running');
            const b = opFor('plugin-b', 'requested');
            expect(activePluginOperationFor([a, b], 'plugin-a')).toBe(a);
            expect(activePluginOperationFor([a, b], 'plugin-b')).toBe(b);
        });

        it('ignores terminal operations, other plugins, and missing data', () => {
            expect(activePluginOperationFor([opFor('plugin-a', 'succeeded')], 'plugin-a')).toBeNull();
            expect(activePluginOperationFor([opFor('plugin-a', 'running')], 'plugin-b')).toBeNull();
            expect(activePluginOperationFor(undefined, 'plugin-a')).toBeNull();
            expect(activePluginOperationFor(null, 'plugin-a')).toBeNull();
        });
    });

    describe('pluginOperationBusyLabel', () => {
        it('maps each lifecycle type to a present-progressive label', () => {
            expect(pluginOperationBusyLabel('install')).toBe('Installing…');
            expect(pluginOperationBusyLabel('update')).toBe('Updating…');
            expect(pluginOperationBusyLabel('uninstall')).toBe('Uninstalling…');
            expect(pluginOperationBusyLabel('purge')).toBe('Purging…');
            expect(pluginOperationBusyLabel('enable')).toBe('Enabling…');
            expect(pluginOperationBusyLabel('disable')).toBe('Disabling…');
            expect(pluginOperationBusyLabel('rollback')).toBe('Rolling back…');
            expect(pluginOperationBusyLabel('repair')).toBe('Repairing…');
        });
    });

    describe('refetch intervals (SSE-aware fallback)', () => {
        const SSE_DOWN = false;
        const SSE_UP = true;

        it('polls fast only while SSE is DOWN and an operation is in flight', () => {
            expect(operationsRefetchInterval([op('running')], SSE_DOWN)).toBe(PLUGIN_OPERATION_ACTIVE_POLL_MS);
            expect(operationsRefetchInterval([op('succeeded')], SSE_DOWN)).toBe(false);
            expect(operationsRefetchInterval(undefined, SSE_DOWN)).toBe(false);
        });

        it('never polls the operations query while SSE is connected', () => {
            expect(operationsRefetchInterval([op('running')], SSE_UP)).toBe(false);
            expect(operationsRefetchInterval([op('requested')], SSE_UP)).toBe(false);
        });

        it('drives the plugin surface queries from active flag AND SSE state', () => {
            expect(pluginSurfaceRefetchInterval(true, SSE_DOWN)).toBe(PLUGIN_OPERATION_ACTIVE_POLL_MS);
            expect(pluginSurfaceRefetchInterval(false, SSE_DOWN)).toBe(false);
            // SSE connected → trust the stream, no polling even with an active op.
            expect(pluginSurfaceRefetchInterval(true, SSE_UP)).toBe(false);
        });
    });
});
