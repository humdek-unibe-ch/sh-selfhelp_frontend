/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression for the plugin-operation → step-list mapping that drives the
 * admin progress Timeline. The list must always start with "Requested",
 * surface granular log stages while running, and end with a terminal step that
 * reflects the final status (incl. the error summary on failure).
 */
import { describe, it, expect } from 'vitest';
import type { IAdminPluginOperation } from '../../../../../../types/responses/admin/plugins.types';
import { buildPluginOperationSteps, pluginOperationActiveIndex } from '../plugin-operation-steps';

function makeOp(partial: Partial<IAdminPluginOperation>): IAdminPluginOperation {
    return {
        id: 1,
        pluginId: 'qa-plugin',
        type: 'install',
        status: 'requested',
        installMode: 'managed',
        createdAt: '2026-06-16T08:00:00Z',
        ...partial,
    };
}

describe('buildPluginOperationSteps', () => {
    it('shows a single active "Requested" step for a freshly requested op', () => {
        const steps = buildPluginOperationSteps(makeOp({ status: 'requested' }));
        expect(steps.map((s) => s.label)).toEqual(['Requested']);
        expect(steps[0]?.state).toBe('active');
    });

    it('adds a synthetic "Running…" step when running with no granular logs', () => {
        const steps = buildPluginOperationSteps(
            makeOp({ status: 'running', startedAt: '2026-06-16T08:00:05Z' }),
        );
        expect(steps.map((s) => s.label)).toEqual(['Requested', 'Running…']);
        expect(steps[0]?.state).toBe('done');
        expect(steps[1]?.state).toBe('active');
    });

    it('surfaces granular log stages, marking the last as active while running', () => {
        const steps = buildPluginOperationSteps(
            makeOp({
                status: 'running',
                startedAt: '2026-06-16T08:00:05Z',
                logs: [
                    { stage: 'Downloading package', ts: '2026-06-16T08:00:06Z' },
                    { stage: 'Running migrations', ts: '2026-06-16T08:00:09Z' },
                ],
            }),
        );
        expect(steps.map((s) => s.label)).toEqual(['Requested', 'Downloading package', 'Running migrations']);
        expect(steps[1]?.state).toBe('done');
        expect(steps[2]?.state).toBe('active');
    });

    it('ends with a green "Completed" step on success (no duplicate terminal log)', () => {
        const steps = buildPluginOperationSteps(
            makeOp({
                status: 'succeeded',
                startedAt: '2026-06-16T08:00:05Z',
                finishedAt: '2026-06-16T08:00:30Z',
                logs: [
                    { stage: 'Running migrations', ts: '2026-06-16T08:00:09Z' },
                    { stage: 'Completed', status: 'succeeded', ts: '2026-06-16T08:00:30Z' },
                ],
            }),
        );
        expect(steps.map((s) => s.label)).toEqual(['Requested', 'Running migrations', 'Completed']);
        expect(steps.at(-1)?.state).toBe('done');
    });

    it('ends with a red "Failed" step carrying the error summary', () => {
        const steps = buildPluginOperationSteps(
            makeOp({
                type: 'uninstall',
                status: 'failed',
                errorSummary: 'composer remove failed',
                finishedAt: '2026-06-16T08:01:00Z',
                logs: [{ stage: 'Failed', status: 'failed', error: 'composer remove failed', ts: '2026-06-16T08:01:00Z' }],
            }),
        );
        const terminal = steps.at(-1);
        expect(terminal?.state).toBe('error');
        expect(terminal?.label).toContain('composer remove failed');
    });
});

describe('pluginOperationActiveIndex', () => {
    it('points at the last non-pending step', () => {
        const steps = buildPluginOperationSteps(
            makeOp({ status: 'running', logs: [{ stage: 'Running migrations', ts: '2026-06-16T08:00:09Z' }] }),
        );
        expect(pluginOperationActiveIndex(steps)).toBe(steps.length - 1);
    });
});
