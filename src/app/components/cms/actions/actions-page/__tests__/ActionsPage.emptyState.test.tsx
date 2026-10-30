/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';

/**
 * L3: with no actions and no filters set, the page said
 * "Try adjusting your search or filter criteria".
 */
vi.mock('../../../../../../hooks/useActions', () => ({
    useActions: () => ({ data: { actions: [], total: 0 }, isFetching: false, refetch: vi.fn() }),
    useDeleteAction: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('../../../../../../hooks/useData', () => ({ useDataTables: () => ({ data: { dataTables: [] } }) }));
vi.mock('../../../../../../hooks/useLookups', () => ({ useLookupsByType: () => [] }));
vi.mock('../../delete-action-modal/DeleteActionModal', () => ({ DeleteActionModal: () => null }));
vi.mock('../../action-form-modal/ActionFormModal', () => ({ ActionFormModal: () => null }));

import { ActionsPage } from '../ActionsPage';

describe('ActionsPage empty state', () => {
    it('does not blame filters when none are applied', () => {
        renderWithProviders(<ActionsPage />);

        expect(screen.getByText('No actions found')).toBeInTheDocument();
        expect(screen.queryByText(/adjusting your search/)).not.toBeInTheDocument();
    });

    it('suggests adjusting filters once a search is applied', async () => {
        renderWithProviders(<ActionsPage />);

        await userEvent.type(screen.getByPlaceholderText(/search/i), 'qa');
        await userEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));

        expect(await screen.findByText(/adjusting your search/)).toBeInTheDocument();
    });
});
