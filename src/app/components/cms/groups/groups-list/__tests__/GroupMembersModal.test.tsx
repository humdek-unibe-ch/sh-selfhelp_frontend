/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { GroupMembersModal } from '../GroupMembersModal';
import { AdminUserApi } from '../../../../../../api/admin/user.api';
import type { IUserBasic, IUsersListResponse } from '../../../../../../types/responses/admin/users.types';

const member = (id: number, over: Partial<IUserBasic> = {}): IUserBasic => ({
    id,
    email: `user${id}@selfhelp.test`,
    name: `User ${id}`,
    user_name: `user${id}`,
    last_login: null,
    status: 'active',
    blocked: false,
    receives_notifications: false,
    receives_emails: false,
    code: null,
    validation_code: null,
    groups: '',
    roles: '',
    user_activity: 0,
    user_type_code: 'user',
    user_type: 'User',
    ...over,
});

const page = (users: IUserBasic[], totalCount = users.length): IUsersListResponse => ({
    users,
    pagination: { page: 1, pageSize: 20, totalCount, totalPages: Math.ceil(totalCount / 20), hasNext: false, hasPrevious: false },
});

function setup(group: { id: number; name: string } | null = { id: 7, name: 'Editors' }) {
    renderWithProviders(<GroupMembersModal opened onClose={vi.fn()} group={group} />);
}

describe('GroupMembersModal', () => {
    beforeEach(() => vi.restoreAllMocks());

    it('lists the members of the group from the users list', async () => {
        const spy = vi.spyOn(AdminUserApi, 'getUsers').mockResolvedValue(page([member(1), member(2)], 42));
        setup();
        expect(await screen.findByText('user1@selfhelp.test')).toBeInTheDocument();
        expect(screen.getByText('Members of Editors')).toBeInTheDocument();
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id_groups: 7, page: 1, pageSize: 20 }));
    });

    it('searches and filters the members by status on Apply', async () => {
        const spy = vi.spyOn(AdminUserApi, 'getUsers').mockResolvedValue(page([member(1)]));
        setup();
        await screen.findByText('user1@selfhelp.test');

        fireEvent.change(screen.getByRole('textbox', { name: 'Search members' }), { target: { value: 'anna' } });
        fireEvent.click(screen.getByRole('button', { name: /Apply/ }));

        await waitFor(() =>
            expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ id_groups: 7, search: 'anna', page: 1 })),
        );
    });

    it('says when nothing matches the filters', async () => {
        vi.spyOn(AdminUserApi, 'getUsers').mockResolvedValue(page([]));
        setup();
        expect(await screen.findByText('No members')).toBeInTheDocument();
        expect(screen.getByText('This group has no users yet.')).toBeInTheDocument();
    });

    it('marks a blocked member as blocked regardless of status', async () => {
        vi.spyOn(AdminUserApi, 'getUsers').mockResolvedValue(page([member(1, { blocked: true, status: 'active' })]));
        setup();
        expect(await screen.findByText('Blocked')).toBeInTheDocument();
    });

    it('surfaces a load failure instead of an empty list', async () => {
        vi.spyOn(AdminUserApi, 'getUsers').mockRejectedValue(new Error('boom'));
        setup();
        expect(await screen.findByText('Could not load members')).toBeInTheDocument();
    });

    it('does not fetch when there is no group', async () => {
        const spy = vi.spyOn(AdminUserApi, 'getUsers').mockResolvedValue(page([]));
        setup(null);
        await waitFor(() => expect(spy).not.toHaveBeenCalled());
    });
});
