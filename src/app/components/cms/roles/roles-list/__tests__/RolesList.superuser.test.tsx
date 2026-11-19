/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type { IRoleDetails, IRolesListResponse } from '../../../../../../types/responses/admin/roles.types';

const roles: IRoleDetails[] = [
    {
        id: 1,
        name: 'Owners',
        description: 'Renamed full-access role',
        is_superuser: true,
        permissions: [],
        users_count: 1,
        permissions_count: 0,
    },
    {
        id: 2,
        name: 'admin',
        description: 'Plain role that happens to be named admin',
        is_superuser: false,
        permissions: [],
        users_count: 0,
        permissions_count: 0,
    },
];

const rolesResponse: IRolesListResponse = {
    roles,
    pagination: {
        page: 1,
        pageSize: 20,
        totalCount: 2,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
    },
};

vi.mock('../../../../../../hooks/useRoles', () => ({
    useRoles: () => ({
        data: rolesResponse,
        refetch: vi.fn(),
        isFetching: false,
        error: null,
    }),
}));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({
        permissionChecker: { hasPermission: () => true },
    }),
}));

import { RolesList } from '../RolesList';

describe('RolesList is_superuser protection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('protects a renamed superuser role and not a plain role named admin', async () => {
        const user = userEvent.setup();
        const onDeleteRole = vi.fn();
        const onEditRole = vi.fn();

        renderWithProviders(
            <RolesList onDeleteRole={onDeleteRole} onEditRole={onEditRole} />,
        );

        expect(screen.getByText('Owners')).toBeInTheDocument();
        expect(screen.getByText('Full access')).toBeInTheDocument();
        expect(screen.getByText('admin')).toBeInTheDocument();

        const moreButtons = screen.getAllByLabelText('More actions');
        expect(moreButtons).toHaveLength(2);

        // Superuser (Owners): delete disabled
        await user.click(moreButtons[0]);
        const lockedDelete = await screen.findByText('Full-access role cannot be deleted');
        expect(lockedDelete.closest('button') ?? lockedDelete).toHaveAttribute('data-disabled', 'true');
        await user.keyboard('{Escape}');

        // Plain role named admin: delete offered
        await user.click(moreButtons[1]);
        const deleteItem = await screen.findByText('Delete Role');
        expect(deleteItem).toBeInTheDocument();
        await user.click(deleteItem);
        expect(onDeleteRole).toHaveBeenCalledWith(2, 'admin');
    });
});
