/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { RoleMembersModal } from '../RoleMembersModal';
import { AdminRoleApi } from '../../../../../../api/admin/role.api';
import type { IMemberUser } from '../../../../../../types/responses/admin/admin.types';

const member = (id: number, over: Partial<IMemberUser> = {}): IMemberUser => ({
    id,
    email: `user${id}@selfhelp.test`,
    name: `User ${id}`,
    user_name: `user${id}`,
    status: 'active',
    blocked: false,
    ...over,
});

function setup(role: { id: number; name: string } | null = { id: 5, name: 'Admin' }) {
    renderWithProviders(<RoleMembersModal opened onClose={vi.fn()} role={role} />);
}

describe('RoleMembersModal', () => {
    beforeEach(() => vi.restoreAllMocks());

    it('lists the users who have the role', async () => {
        vi.spyOn(AdminRoleApi, 'getRoleMembers').mockResolvedValue([member(1), member(2)]);
        setup();
        expect(await screen.findByText('user1@selfhelp.test')).toBeInTheDocument();
        expect(screen.getByText('2 members')).toBeInTheDocument();
    });

    it('names the role it is showing', async () => {
        vi.spyOn(AdminRoleApi, 'getRoleMembers').mockResolvedValue([member(1)]);
        setup({ id: 5, name: 'Admin' });
        expect(await screen.findByText('Users with role Admin')).toBeInTheDocument();
    });

    it('shows an empty state for a role with no users', async () => {
        vi.spyOn(AdminRoleApi, 'getRoleMembers').mockResolvedValue([]);
        setup();
        expect(await screen.findByText('No members')).toBeInTheDocument();
    });

    it('surfaces a load failure instead of an empty list', async () => {
        vi.spyOn(AdminRoleApi, 'getRoleMembers').mockRejectedValue(new Error('boom'));
        setup();
        expect(await screen.findByText('Could not load members')).toBeInTheDocument();
    });

    it('does not fetch when there is no role', async () => {
        const spy = vi.spyOn(AdminRoleApi, 'getRoleMembers').mockResolvedValue([]);
        setup(null);
        await waitFor(() => expect(spy).not.toHaveBeenCalled());
    });
});
