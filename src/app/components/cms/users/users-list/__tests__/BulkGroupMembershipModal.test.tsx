/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { BulkGroupMembershipModal } from '../BulkGroupMembershipModal';
import { AdminGroupApi } from '../../../../../../api/admin/group.api';

function mockGroups() {
    vi.spyOn(AdminGroupApi, 'getGroups').mockResolvedValue({
        groups: [
            { id: 1, name: 'Editors', description: null, id_group_types: null, requires_2fa: false, users_count: 0, acls: [] },
            { id: 2, name: 'Viewers', description: null, id_group_types: null, requires_2fa: false, users_count: 0, acls: [] },
        ],
        pagination: { page: 1, pageSize: 100, totalCount: 2, totalPages: 1, hasNext: false, hasPrevious: false },
    });
}

async function pickGroup(user: ReturnType<typeof userEvent.setup>, name: string) {
    await user.click(screen.getByPlaceholderText('Pick one or more groups'));
    await user.click(await screen.findByText(name));
}

describe('BulkGroupMembershipModal', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mockGroups();
    });

    it('uses the verb for the mode it is opened in', () => {
        const { rerender } = renderWithProviders(
            <BulkGroupMembershipModal opened mode="add" selectedCount={2} onClose={vi.fn()} onConfirm={vi.fn()} isLoading={false} />,
        );
        expect(screen.getByText('Add users to group')).toBeInTheDocument();

        rerender(
            <BulkGroupMembershipModal opened mode="remove" selectedCount={2} onClose={vi.fn()} onConfirm={vi.fn()} isLoading={false} />,
        );
        expect(screen.getByText('Remove users from group')).toBeInTheDocument();
    });

    it('confirms with the picked group ids', async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        renderWithProviders(
            <BulkGroupMembershipModal opened mode="add" selectedCount={2} onClose={vi.fn()} onConfirm={onConfirm} isLoading={false} />,
        );
        await pickGroup(user, 'Editors');
        await user.click(screen.getByRole('button', { name: 'Add to group' }));
        expect(onConfirm).toHaveBeenCalledWith([1]);
    });

    // Regression: after a submit the parent closes the modal by flipping its
    // open flag, not via onClose, so a stale selection used to reappear on
    // the next open. Reopening must start empty.
    it('clears the previous selection when reopened', async () => {
        const user = userEvent.setup();
        const { rerender } = renderWithProviders(
            <BulkGroupMembershipModal opened mode="add" selectedCount={2} onClose={vi.fn()} onConfirm={vi.fn()} isLoading={false} />,
        );
        await pickGroup(user, 'Editors');
        // The primary button enables once something is selected.
        expect(screen.getByRole('button', { name: 'Add to group' })).toBeEnabled();

        // Close (parent flips opened) then reopen — no group should be preselected.
        rerender(
            <BulkGroupMembershipModal opened={false} mode="add" selectedCount={2} onClose={vi.fn()} onConfirm={vi.fn()} isLoading={false} />,
        );
        rerender(
            <BulkGroupMembershipModal opened mode="add" selectedCount={2} onClose={vi.fn()} onConfirm={vi.fn()} isLoading={false} />,
        );

        // The primary button is disabled only when nothing is selected, so its
        // disabled state is the unambiguous proof the selection was cleared.
        expect(screen.getByRole('button', { name: 'Add to group' })).toBeDisabled();
    });

    it('clears the selection when the mode flips without remounting', async () => {
        const user = userEvent.setup();
        const { rerender } = renderWithProviders(
            <BulkGroupMembershipModal opened mode="add" selectedCount={2} onClose={vi.fn()} onConfirm={vi.fn()} isLoading={false} />,
        );
        await pickGroup(user, 'Editors');
        expect(screen.getByRole('button', { name: 'Add to group' })).toBeEnabled();

        rerender(
            <BulkGroupMembershipModal opened mode="remove" selectedCount={2} onClose={vi.fn()} onConfirm={vi.fn()} isLoading={false} />,
        );
        expect(screen.getByRole('button', { name: 'Remove from group' })).toBeDisabled();
    });
});
