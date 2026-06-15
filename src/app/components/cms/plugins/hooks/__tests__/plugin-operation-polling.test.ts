/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { describe, expect, it } from 'vitest';
import type { IAdminPluginOperation } from '../../../../../../types/responses/admin/plugins.types';
import {
    PLUGIN_OPERATION_ACTIVE_POLL_MS,
    hasActivePluginOperation,
    isPluginOperationActive,
    operationsRefetchInterval,
    pluginSurfaceRefetchInterval,
} from '../plugin-operation-polling';

function op(status: IAdminPluginOperation['status']): IAdminPluginOperation {
    return {
        id: 1,
        pluginId: 'qa-plugin',
        type: 'install',
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

    describe('refetch intervals', () => {
        it('polls fast while an operation is in flight and stops otherwise', () => {
            expect(operationsRefetchInterval([op('running')])).toBe(PLUGIN_OPERATION_ACTIVE_POLL_MS);
            expect(operationsRefetchInterval([op('succeeded')])).toBe(false);
            expect(operationsRefetchInterval(undefined)).toBe(false);
        });

        it('drives the plugin surface queries from the active flag', () => {
            expect(pluginSurfaceRefetchInterval(true)).toBe(PLUGIN_OPERATION_ACTIVE_POLL_MS);
            expect(pluginSurfaceRefetchInterval(false)).toBe(false);
        });
    });
});
