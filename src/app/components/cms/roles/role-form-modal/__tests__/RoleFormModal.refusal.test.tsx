/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient, renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';
import type { IRoleDetails } from '../../../../../../types/responses/admin/roles.types';

/**
 * P5-A3, role part: when the server refuses a role change with a 403 and its own
 * text (C4), a person reads exactly that text, not a generic "Failed to update role".
 * The real hooks run; only the API calls are replaced. The text reaches the screen
 * through `getApiErrorText` in the mutation hooks.
 */
const { notify, held } = vi.hoisted(() => ({
    notify: vi.fn(),
    held: { current: new Set<string>() },
}));

vi.mock('@mantine/notifications', () => ({ notifications: { show: notify } }));
vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({
        permissionChecker: { hasPermission: (name: string) => held.current.has(name) },
    }),
}));

import { AdminRoleApi } from '../../../../../../api/admin/role.api';
import { AdminPermissionApi } from '../../../../../../api/admin/permission.api';
import { useDeleteRole } from '../../../../../../hooks/useRoles';
import { RoleFormModal } from '../RoleFormModal';

/** A 403 as the API client raises it: the envelope's `error` carries the reason, `message` the phrase. */
const refusal = (error: string) => ({
    response: {
        status: 403,
        data: { status: 403, message: 'Forbidden', error, logged_in: true, data: null },
    },
});

const role: IRoleDetails = {
    id: 9,
    name: 'qa_scoped',
    description: 'Scoped role',
    is_superuser: false,
    permissions: [{ id: 1, name: 'admin.group.read', description: 'See groups', resource: 'group', action: 'read' }],
    users_count: 0,
    permissions_count: 1,
    can_update: true,
    can_delete: true,
};

const ROLE_REFUSALS: Array<[string, string]> = [
    ['a right the caller does not hold', 'You can only give a role rights you hold yourself: admin.user.impersonate.'],
    ['a role whose rights the caller does not all hold', 'You can only change or delete a role whose rights you all hold.'],
    ['a permission list without admin.role.permissions', "Changing a role's permissions needs admin.role.permissions."],
];

describe('role screens show the server text of a refusal (C4)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Element.prototype.scrollIntoView = vi.fn();
        held.current = new Set([PERMISSIONS.ADMIN_ROLE_UPDATE, PERMISSIONS.ADMIN_ROLE_PERMISSIONS]);
        vi.spyOn(AdminRoleApi, 'getRoleById').mockResolvedValue(role);
        vi.spyOn(AdminPermissionApi, 'getAllPermissions').mockResolvedValue({
            permissions: [
                { id: 1, name: 'admin.group.read', description: 'See groups', can_assign: true, implied_read: null },
            ],
        });
    });

    it.each(ROLE_REFUSALS)('saving a role: %s', async (_case, text) => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        vi.spyOn(AdminRoleApi, 'updateRole').mockRejectedValue(refusal(text));
        renderWithProviders(<RoleFormModal opened onClose={onClose} mode="edit" roleId={9} />);

        const save = screen.getByRole('button', { name: 'Update Role' });
        await waitFor(() => expect(save).toBeEnabled());
        await user.click(save);

        await waitFor(() => expect(notify).toHaveBeenCalledTimes(1));
        expect(notify).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error', message: text, color: 'red' }));
        // The form stays open, so nothing the person typed is lost.
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Update Role' })).toBeInTheDocument();
    });

    it('creating a role whose rights the caller does not hold shows the server text', async () => {
        const user = userEvent.setup();
        const text = 'You can only give a role rights you hold yourself: admin.user.impersonate.';
        vi.spyOn(AdminRoleApi, 'createRole').mockRejectedValue(refusal(text));
        held.current = new Set([PERMISSIONS.ADMIN_ROLE_CREATE, PERMISSIONS.ADMIN_ROLE_PERMISSIONS]);
        renderWithProviders(<RoleFormModal opened onClose={vi.fn()} mode="create" />);

        await waitFor(() => expect(screen.getByRole('button', { name: 'Create Role' })).toBeEnabled());
        await user.type(screen.getByRole('textbox', { name: /Role Name/ }), 'qa_role');
        await user.click(screen.getByRole('button', { name: 'Create Role' }));

        await waitFor(() => expect(notify).toHaveBeenCalledTimes(1));
        expect(notify).toHaveBeenCalledWith(expect.objectContaining({ message: text, color: 'red' }));
    });

    it('deleting a role the caller does not fully hold shows the server text', async () => {
        const text = 'You can only change or delete a role whose rights you all hold.';
        vi.spyOn(AdminRoleApi, 'deleteRole').mockRejectedValue(refusal(text));
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
        );
        const { result } = renderHook(() => useDeleteRole(), { wrapper });

        await expect(result.current.mutateAsync(9)).rejects.toBeTruthy();

        await waitFor(() => expect(notify).toHaveBeenCalledTimes(1));
        expect(notify).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error', message: text, color: 'red' }));
    });
});
