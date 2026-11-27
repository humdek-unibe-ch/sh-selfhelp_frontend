/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type { IRolesListResponse } from '../../../../../../types/responses/admin/roles.types';

// F239 least-privilege walk: "Create Role" belongs to `admin.role.create`, not to read or update.
const state = vi.hoisted(() => ({ held: new Set<string>() }));

const rolesResponse: IRolesListResponse = {
    roles: [],
    pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasNext: false, hasPrevious: false },
};

vi.mock('../../../../../../hooks/useRoles', () => ({
    useRoles: () => ({ data: rolesResponse, refetch: vi.fn(), isFetching: false, error: null }),
}));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission: (name: string) => state.held.has(name) } }),
}));

import { RolesList } from '../RolesList';

describe('RolesList "Create Role"', () => {
    beforeEach(() => {
        state.held = new Set(['admin.access', 'admin.role.read']);
    });

    it('is hidden from a person who holds read and update but not create', () => {
        state.held.add('admin.role.update');
        renderWithProviders(<RolesList />);
        expect(screen.queryByRole('button', { name: 'Create Role' })).not.toBeInTheDocument();
    });

    it('is shown to the holder of admin.role.create', () => {
        state.held.add('admin.role.create');
        renderWithProviders(<RolesList />);
        expect(screen.getByRole('button', { name: 'Create Role' })).toBeInTheDocument();
    });
});
