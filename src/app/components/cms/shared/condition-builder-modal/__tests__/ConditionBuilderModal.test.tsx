/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';

/**
 * Regression guard for the "Too many re-renders" crash that surfaced after the
 * lint refactor (ConditionBuilderField → ConditionBuilderModal, also reached via
 * the Actions page "New Action" flow).
 *
 * Root cause: the modal synced its query state from `initialValue` during the
 * RENDER phase, keying that sync on the objects returned by
 * `useConditionBuilderData`. That hook returns `groups`/`platforms`/`pages` as
 * `query.data || {}`, i.e. a BRAND-NEW object reference on every render while the
 * data is undefined (loading/empty). A render-phase `setState` whose guard
 * depends on a value rebuilt every render re-enters synchronously forever.
 *
 * This mock reproduces that exact instability: every call returns fresh `{}`
 * references with `isLoading: false` (so the sync path runs). With the bug
 * present, rendering throws "Too many re-renders"; with the effect-based fix it
 * renders once and settles.
 */
const dataHookCalls = vi.hoisted(() => ({ count: 0 }));

vi.mock('../../../../../../hooks/useConditionBuilderData', () => ({
    useConditionBuilderData: () => {
        dataHookCalls.count += 1;
        // Fresh object identities each render — the loop trigger.
        return {
            groups: {},
            languages: {},
            platforms: {},
            pages: {},
            isLoading: false,
            isError: false,
            error: null,
        };
    },
}));

import { ConditionBuilderModal } from '../ConditionBuilderModal';

beforeEach(() => {
    dataHookCalls.count = 0;
});

describe('ConditionBuilderModal (re-render regression)', () => {
    it('renders without an infinite render loop when builder data has unstable refs', async () => {
        renderWithProviders(
            <ConditionBuilderModal
                opened
                onClose={vi.fn()}
                onSave={vi.fn()}
                initialValue=""
            />,
        );

        // If the render-phase setState loop regressed, the line above throws
        // "Too many re-renders" before we get here. Reaching the assertions and
        // seeing the modal chrome means the component settled.
        expect(await screen.findByText('Condition Builder')).toBeInTheDocument();

        // A settled component calls the data hook a small, bounded number of
        // times. The old loop drove this into the thousands before React bailed.
        expect(dataHookCalls.count).toBeLessThan(25);
    });

    it('parses a valid initialValue without looping', async () => {
        const initial = JSON.stringify({ and: [{ '==': [{ var: 'user_group' }, 'admin'] }] });

        renderWithProviders(
            <ConditionBuilderModal
                opened
                onClose={vi.fn()}
                onSave={vi.fn()}
                initialValue={initial}
                title="Edit Condition"
            />,
        );

        expect(await screen.findByText('Edit Condition')).toBeInTheDocument();
        expect(dataHookCalls.count).toBeLessThan(25);
    });
});
