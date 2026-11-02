/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { UsersBulkActionsBar } from '../UsersBulkActionsBar';

function setup(overrides: Partial<Parameters<typeof UsersBulkActionsBar>[0]> = {}) {
    const onAddToGroup = vi.fn();
    const onRemoveFromGroup = vi.fn();
    const onSendActivation = vi.fn();
    const onDelete = vi.fn();
    renderWithProviders(
        <UsersBulkActionsBar
            selectedCount={2}
            onAddToGroup={onAddToGroup}
            onRemoveFromGroup={onRemoveFromGroup}
            onSendActivation={onSendActivation}
            onDelete={onDelete}
            isBusy={false}
            permissions={{ canUpdate: true, canDelete: true }}
            {...overrides}
        />,
    );
    return { onAddToGroup, onRemoveFromGroup, onSendActivation, onDelete };
}

describe('UsersBulkActionsBar', () => {
    it('reports how many users the actions will apply to', () => {
        setup();
        expect(screen.getByText('2 users selected')).toBeInTheDocument();
    });

    it('singularises the count for one user', () => {
        setup({ selectedCount: 1 });
        expect(screen.getByText('1 user selected')).toBeInTheDocument();
    });

    it('raises delete for confirmation rather than deleting directly', async () => {
        const user = userEvent.setup();
        const { onDelete } = setup();
        await user.click(screen.getByRole('button', { name: /Delete/ }));
        expect(onDelete).toHaveBeenCalledOnce();
    });

    it('offers group removal as well as addition', async () => {
        const user = userEvent.setup();
        const { onRemoveFromGroup } = setup();
        await user.click(screen.getByRole('button', { name: 'Remove from group' }));
        expect(onRemoveFromGroup).toHaveBeenCalledOnce();
    });

    it('disables write actions without update permission', () => {
        setup({ permissions: { canUpdate: false, canDelete: true } });
        expect(screen.getByRole('button', { name: 'Add to group' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Remove from group' })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Send activation/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Delete/ })).toBeEnabled();
    });

    it('disables delete without delete permission', () => {
        setup({ permissions: { canUpdate: true, canDelete: false } });
        expect(screen.getByRole('button', { name: /Delete/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Add to group' })).toBeEnabled();
    });

    it('locks every action while a bulk run is in flight', () => {
        setup({ isBusy: true });
        expect(screen.getByRole('button', { name: 'Add to group' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Remove from group' })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Send activation/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Delete/ })).toBeDisabled();
    });
});
