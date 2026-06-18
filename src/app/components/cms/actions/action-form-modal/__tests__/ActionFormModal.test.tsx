/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';

// Simulates the reported bug's trigger: the action-details query is ALREADY
// cached, so `useActionDetails` returns data synchronously on the modal's first
// render (as it does when reopening an action). With the old `prevDetails ===
// details` guard the populate never fired and the form stayed empty.
vi.mock('../../../../../../hooks/useActions', () => ({
    useCreateAction: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpdateAction: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useActionDetails: () => ({
        data: {
            id: 5,
            name: 'My Action',
            action_trigger_type: { id: 2, lookup_value: 'finished' },
            data_table: { id: 3, name: 'dt', displayName: 'DT' },
            config: { blocks: [] },
        },
        isLoading: false,
    }),
}));

vi.mock('../../../../../../hooks/useLookups', () => ({
    useLookupsByType: () => [{ id: 2, lookupValue: 'finished', lookupCode: 'finished' }],
}));

vi.mock('../../../../../../hooks/useData', () => ({
    useDataTables: () => ({ data: { dataTables: [{ id: 3, name: 'dt', displayName: 'DT' }] } }),
}));

// The config builder pulls in Monaco + many hooks; stub it for this unit test.
vi.mock('../../action-config-builder/ActionConfigBuilder', () => ({
    ActionConfigBuilder: () => null,
}));

import { ActionFormModal } from '../ActionFormModal';

describe('ActionFormModal — edit population', () => {
    it('populates the form from already-cached action details on mount', () => {
        renderWithProviders(<ActionFormModal opened mode="edit" actionId={5} onClose={() => undefined} />);

        // The bug left this empty; the fix syncs from cached details on mount.
        expect(screen.getByLabelText(/Action name/i)).toHaveValue('My Action');
    });
});
