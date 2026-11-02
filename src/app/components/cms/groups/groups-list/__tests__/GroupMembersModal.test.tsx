/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { GroupMembersModal } from '../GroupMembersModal';
import { AdminGroupApi } from '../../../../../../api/admin/group.api';
import type { IGroupMember } from '../../../../../../types/responses/admin/groups.types';

const member = (id: number, over: Partial<IGroupMember> = {}): IGroupMember => ({
    id,
    email: `user${id}@selfhelp.test`,
    name: `User ${id}`,
    user_name: `user${id}`,
    status: 'active',
    blocked: false,
    ...over,
});

function setup(group: { id: number; name: string } | null = { id: 3, name: 'Editors' }) {
    renderWithProviders(<GroupMembersModal opened onClose={vi.fn()} group={group} />);
}

describe('GroupMembersModal', () => {
    beforeEach(() => vi.restoreAllMocks());

    it('lists the users in the group', async () => {
        vi.spyOn(AdminGroupApi, 'getGroupMembers').mockResolvedValue([member(1), member(2)]);
        setup();
        expect(await screen.findByText('user1@selfhelp.test')).toBeInTheDocument();
        expect(screen.getByText('user2@selfhelp.test')).toBeInTheDocument();
        expect(screen.getByText('2 members')).toBeInTheDocument();
    });

    it('names the group it is showing', async () => {
        vi.spyOn(AdminGroupApi, 'getGroupMembers').mockResolvedValue([member(1)]);
        setup({ id: 3, name: 'Editors' });
        expect(await screen.findByText('Members of Editors')).toBeInTheDocument();
    });

    it('shows an empty state for a group with no members', async () => {
        vi.spyOn(AdminGroupApi, 'getGroupMembers').mockResolvedValue([]);
        setup();
        expect(await screen.findByText('No members')).toBeInTheDocument();
    });

    it('surfaces a load failure instead of an empty list', async () => {
        vi.spyOn(AdminGroupApi, 'getGroupMembers').mockRejectedValue(new Error('boom'));
        setup();
        expect(await screen.findByText('Could not load members')).toBeInTheDocument();
    });

    it('marks a blocked member as blocked regardless of status', async () => {
        vi.spyOn(AdminGroupApi, 'getGroupMembers').mockResolvedValue([
            member(1, { blocked: true, status: 'active' }),
        ]);
        setup();
        expect(await screen.findByText('Blocked')).toBeInTheDocument();
    });

    it('does not fetch when there is no group', async () => {
        const spy = vi.spyOn(AdminGroupApi, 'getGroupMembers').mockResolvedValue([]);
        setup(null);
        await waitFor(() => expect(spy).not.toHaveBeenCalled());
    });
});
