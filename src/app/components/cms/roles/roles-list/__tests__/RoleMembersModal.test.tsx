/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { RoleMembersModal } from '../RoleMembersModal';
import { AdminUserApi } from '../../../../../../api/admin/user.api';
import type { IUsersListResponse } from '../../../../../../types/responses/admin/users.types';

const page = (emails: string[]): IUsersListResponse => ({
    users: emails.map((email, index) => ({
        id: index + 1,
        email,
        name: null,
        user_name: null,
        last_login: null,
        status: 'active',
        blocked: false,
        receives_notifications: false,
        receives_emails: false,
        code: null,
        validation_code: null,
        groups: '',
        roles: 'admin',
        user_activity: 0,
        user_type_code: 'user',
        user_type: 'User',
    })),
    pagination: { page: 1, pageSize: 20, totalCount: emails.length, totalPages: 1, hasNext: false, hasPrevious: false },
});

describe('RoleMembersModal', () => {
    beforeEach(() => vi.restoreAllMocks());

    it('lists the holders of the role from the users list, filtered by role id', async () => {
        const spy = vi.spyOn(AdminUserApi, 'getUsers').mockResolvedValue(page(['qa.admin@selfhelp.test']));
        renderWithProviders(<RoleMembersModal opened onClose={vi.fn()} role={{ id: 5, name: 'Admin' }} />);

        expect(await screen.findByText('qa.admin@selfhelp.test')).toBeInTheDocument();
        expect(screen.getByText('Members of Admin')).toBeInTheDocument();
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id_roles: 5 }));
        expect(spy.mock.calls[0][0]).not.toHaveProperty('id_groups');
    });

    it('shows an empty state for a role with no users', async () => {
        vi.spyOn(AdminUserApi, 'getUsers').mockResolvedValue(page([]));
        renderWithProviders(<RoleMembersModal opened onClose={vi.fn()} role={{ id: 5, name: 'Admin' }} />);
        expect(await screen.findByText('This role has no users yet.')).toBeInTheDocument();
    });

    it('does not fetch when there is no role', async () => {
        const spy = vi.spyOn(AdminUserApi, 'getUsers').mockResolvedValue(page([]));
        renderWithProviders(<RoleMembersModal opened onClose={vi.fn()} role={null} />);
        await waitFor(() => expect(spy).not.toHaveBeenCalled());
    });
});
