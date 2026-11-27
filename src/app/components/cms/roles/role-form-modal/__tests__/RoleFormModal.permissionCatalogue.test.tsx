/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { server } from '../../../../../../test-utils/msw/server';
import { apiEnvelope } from '../../../../../../test-utils/msw/createHandlers';
import { permissionManager } from '../../../../../../api/permission-wrapper.api';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';
import type { IRoleDetails } from '../../../../../../types/responses/admin/roles.types';

/**
 * The role form draws its permission picker from `GET /admin/permissions`. A
 * role editor holds `admin.role.update` but not necessarily `admin.permission.read`;
 * the route opens for either right, and so does the client gate in front of it.
 * This test runs the real `usePermissions` hook and the real client gate against
 * MSW: a caller with `admin.role.update` and no `admin.permission.read` sees the
 * permissions by name, not as bare ids. A caller with neither right sends no request.
 */
const CATALOGUE = [
    { id: 11, name: 'admin.group.read', description: 'See groups', can_assign: true, implied_read: null },
    { id: 12, name: 'admin.user.read', description: 'See users', can_assign: true, implied_read: null },
];

const state = vi.hoisted(() => ({
    held: new Set<string>(),
    roleDetails: undefined as IRoleDetails | undefined,
}));

vi.mock('../../../../../../hooks/useRoles', () => ({
    useCreateRole: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpdateRole: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useRoleDetails: () => ({ data: state.roleDetails, isLoading: false }),
}));
vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({
        permissionChecker: { hasPermission: (name: string) => state.held.has(name) },
    }),
}));

import { RoleFormModal } from '../RoleFormModal';

const roleDetails = (): IRoleDetails => ({
    id: 9,
    name: 'qa_read_role',
    description: null,
    is_superuser: false,
    permissions: [{ id: 11, name: 'admin.group.read', description: 'See groups', resource: 'admin', action: 'read' }],
    users_count: 0,
    permissions_count: 1,
    can_update: true,
    can_delete: true,
    fully_held: true,
});

/** Give the caller these rights, in the form and in the client gate. */
function signInWith(...rights: string[]) {
    state.held = new Set(rights);
    permissionManager.setPermissions(rights);
}

describe('RoleFormModal permission catalogue for a role editor', () => {
    let permissionRequests: number;

    beforeEach(() => {
        Element.prototype.scrollIntoView = vi.fn();
        permissionRequests = 0;
        state.roleDetails = roleDetails();
        server.use(
            http.get('*/admin/permissions', () => {
                permissionRequests += 1;
                return HttpResponse.json(apiEnvelope({ permissions: CATALOGUE }));
            }),
        );
    });

    afterEach(() => {
        permissionManager.clearPermissions();
    });

    it('shows permissions by name for a caller with admin.role.update and without admin.permission.read', async () => {
        signInWith(PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_ROLE_READ, PERMISSIONS.ADMIN_ROLE_UPDATE);
        renderWithProviders(<RoleFormModal opened onClose={vi.fn()} mode="edit" roleId={9} />);

        const read = await screen.findByRole('checkbox', { name: 'See groups (admin.group.read)' });
        expect(read).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'See users (admin.user.read)' })).toBeInTheDocument();
        // Names, never a bare id.
        expect(screen.queryByRole('checkbox', { name: /^\d+$/ })).not.toBeInTheDocument();
        expect(permissionRequests).toBe(1);
    });

    it('still works for a caller with admin.permission.read alone', async () => {
        signInWith(PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_PERMISSION_READ);
        renderWithProviders(<RoleFormModal opened onClose={vi.fn()} mode="create" />);

        expect(await screen.findByRole('checkbox', { name: 'See users (admin.user.read)' })).toBeInTheDocument();
        expect(permissionRequests).toBe(1);
    });

    it('sends no request for a caller with neither right', async () => {
        signInWith(PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_ROLE_READ);
        renderWithProviders(<RoleFormModal opened onClose={vi.fn()} mode="edit" roleId={9} />);

        await waitFor(() => expect(screen.getByText('qa_read_role')).toBeInTheDocument());
        // Give a request the time it would need.
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(screen.queryByRole('checkbox', { name: 'See users (admin.user.read)' })).not.toBeInTheDocument();
        expect(permissionRequests).toBe(0);
    });
});
