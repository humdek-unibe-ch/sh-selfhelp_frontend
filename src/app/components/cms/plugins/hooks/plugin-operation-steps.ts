/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Maps a backend `plugin_operations` row to an ordered, renderable step list
 * for the admin UI's progress view (a Mantine Timeline) — the CMS analogue of
 * the manager install checklist ("these steps are executing").
 *
 * The backend records progress as free-form `logs[].stage` entries plus the
 * coarse `status` / `startedAt` / `finishedAt` lifecycle (see
 * `PluginOperationRecorder`), and pushes the same info over Mercure. We derive
 * a faithful, always-non-empty step list from whatever is present so the view
 * is robust to the exact stage vocabulary of each orchestrator.
 */
import type { IAdminPluginOperation } from '../../../../../types/responses/admin/plugins.types';

export type TPluginStepState = 'done' | 'active' | 'pending' | 'error';

export interface IPluginOperationStep {
    key: string;
    label: string;
    at?: string | null;
    state: TPluginStepState;
}

const TERMINAL_STATUSES: ReadonlySet<string> = new Set([
    'succeeded',
    'failed',
    'cancelled',
    'rolled_back',
]);

const TERMINAL_LOG_STATUSES: ReadonlySet<string> = new Set([
    'succeeded',
    'failed',
    'rolled_back',
]);

/** Read a string field off an unknown log entry without trusting its shape. */
function logField(entry: unknown, key: string): string | undefined {
    if (entry && typeof entry === 'object' && key in entry) {
        const value = (entry as Record<string, unknown>)[key];
        return typeof value === 'string' ? value : undefined;
    }
    return undefined;
}

/** Mantine color for an operation status pill. */
export function pluginOperationStatusColor(status: string): string {
    switch (status) {
        case 'succeeded':
            return 'teal';
        case 'failed':
        case 'cancelled':
            return 'red';
        case 'rolled_back':
            return 'orange';
        case 'running':
            return 'blue';
        case 'requested':
        default:
            return 'gray';
    }
}

/**
 * Build the ordered step list for one operation. Always begins with
 * "Requested"; surfaces granular `logs[].stage` entries while running; ends
 * with a terminal step that reflects the final `status` (incl. the error
 * summary on failure).
 */
export function buildPluginOperationSteps(op: IAdminPluginOperation): IPluginOperationStep[] {
    const steps: IPluginOperationStep[] = [];
    const status = op.status;
    const isTerminal = TERMINAL_STATUSES.has(status);

    steps.push({
        key: 'requested',
        label: 'Requested',
        at: op.createdAt,
        state: status === 'requested' ? 'active' : 'done',
    });

    const logs = Array.isArray(op.logs) ? op.logs : [];
    const progressLogs = logs
        .map((entry, index) => ({
            index,
            stage: logField(entry, 'stage'),
            // The backend stamps each entry with `ts` on append; tolerate a
            // legacy `at` just in case.
            at: logField(entry, 'ts') ?? logField(entry, 'at') ?? null,
            logStatus: logField(entry, 'status'),
        }))
        .filter((l): l is { index: number; stage: string; at: string | null; logStatus: string | undefined } =>
            typeof l.stage === 'string' && l.stage !== '' && !TERMINAL_LOG_STATUSES.has(l.logStatus ?? ''),
        );

    // No granular stages reported yet → a single "Running" step keeps the
    // timeline honest for the requested→running window.
    if (status !== 'requested' && !isTerminal && progressLogs.length === 0) {
        steps.push({
            key: 'running',
            label: 'Running…',
            at: op.startedAt ?? null,
            state: status === 'running' ? 'active' : 'done',
        });
    }

    progressLogs.forEach((l, i) => {
        const isLast = i === progressLogs.length - 1;
        steps.push({
            key: `log-${l.index}`,
            label: l.stage,
            at: l.at,
            state: status === 'running' && isLast ? 'active' : 'done',
        });
    });

    if (status === 'succeeded') {
        steps.push({ key: 'succeeded', label: 'Completed', at: op.finishedAt ?? null, state: 'done' });
    } else if (status === 'failed') {
        steps.push({
            key: 'failed',
            label: op.errorSummary ? `Failed — ${op.errorSummary}` : 'Failed',
            at: op.finishedAt ?? null,
            state: 'error',
        });
    } else if (status === 'cancelled') {
        steps.push({ key: 'cancelled', label: 'Cancelled', at: op.finishedAt ?? null, state: 'error' });
    } else if (status === 'rolled_back') {
        steps.push({ key: 'rolled_back', label: 'Rolled back', at: op.finishedAt ?? null, state: 'done' });
    }

    return steps;
}

/**
 * Index for Mantine `Timeline`'s `active` prop: the last step that is not
 * pending (so completed + the current active bullet are highlighted).
 */
export function pluginOperationActiveIndex(steps: readonly IPluginOperationStep[]): number {
    let last = -1;
    steps.forEach((step, index) => {
        if (step.state !== 'pending') last = index;
    });
    return last;
}
