/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';
import type { IRoleDetails, IRolesListResponse } from '../../../../../../types/responses/admin/roles.types';

/**
 * The roles list draws Edit, the three grant buttons and Delete from what the server
 * says the signed-in person may do with each role (`can_update`, `can_delete`), not
 * from permission names alone (rules 4.6f and 4.11). The reasons below are the texts
 * a person reads on the disabled buttons.
 */
const REASON_NOT_HELD = 'You can only change or delete a role whose rights you all hold.';
const REASON_HAS_USERS = 'Cannot delete role with assigned users';
const REASON_SUPERUSER_DELETE = 'Full-access role cannot be deleted';
const REASON_SUPERUSER_GRANTS = 'Full-access role permissions cannot be modified';
const REASON_NEEDS_UPDATE = 'Changing roles needs admin.role.update.';
const REASON_NEEDS_DELETE = 'Deleting roles needs admin.role.delete.';

const role = (overrides: Partial<IRoleDetails> & Pick<IRoleDetails, 'id' | 'name'>): IRoleDetails => ({
    description: '',
    is_superuser: false,
    permissions: [],
    users_count: 0,
    permissions_count: 0,
    can_update: true,
    can_delete: true,
    ...overrides,
});

const state = vi.hoisted(() => ({
    roles: [] as IRoleDetails[],
    held: new Set<string>(),
}));

vi.mock('../../../../../../hooks/useRoles', () => ({
    useRoles: () => ({
        data: {
            roles: state.roles,
            pagination: {
                page: 1,
                pageSize: 20,
                totalCount: state.roles.length,
                totalPages: 1,
                hasNext: false,
                hasPrevious: false,
            },
        } satisfies IRolesListResponse,
        refetch: vi.fn(),
        isFetching: false,
        error: null,
    }),
}));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({
        permissionChecker: { hasPermission: (name: string) => state.held.has(name) },
    }),
}));

import { RolesList } from '../RolesList';

const rowOf = (name: string): HTMLElement => {
    const row = screen.getByText(name).closest('tr');
    if (!row) throw new Error(`No table row for ${name}`);
    return row;
};

/** An item of the open "More actions" menu. (jsdom has no layout, so Mantine's dropdown stays `display: none`.) */
const menuItem = (name: string) => screen.findByRole('menuitem', { name, hidden: true });

const handlers = () => ({
    onEditRole: vi.fn(),
    onDeleteRole: vi.fn(),
    onManagePagePermissions: vi.fn(),
    onManageDataTablePermissions: vi.fn(),
    onManageGroupPermissions: vi.fn(),
});

describe('RolesList draws its actions from can_update and can_delete', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.held = new Set([
            PERMISSIONS.ADMIN_ROLE_READ,
            PERMISSIONS.ADMIN_ROLE_UPDATE,
            PERMISSIONS.ADMIN_ROLE_DELETE,
            PERMISSIONS.ADMIN_USER_READ,
        ]);
        state.roles = [
            // Full-access role seen by a superuser: may be edited, never deleted or granted to.
            role({ id: 1, name: 'Owners', is_superuser: true, users_count: 1, can_update: true, can_delete: false }),
            // Everything allowed.
            role({ id: 2, name: 'editors' }),
            // The person holds fewer rights than this role carries: nothing allowed.
            role({ id: 3, name: 'above_me', can_update: false, can_delete: false }),
            // May be edited, but it still has users.
            role({ id: 4, name: 'with_users', users_count: 3, can_delete: false }),
        ];
    });

    it('enables Edit, the grant buttons and Delete for a role the person may change and delete', async () => {
        const user = userEvent.setup();
        const callbacks = handlers();
        renderWithProviders(<RolesList {...callbacks} />);

        const row = rowOf('editors');
        const edit = within(row).getByLabelText('Edit role');
        const page = within(row).getByLabelText('Manage Page Permissions');
        const dataTable = within(row).getByLabelText('Manage Data Table Permissions');
        const group = within(row).getByLabelText('Manage Group Permissions');
        [edit, page, dataTable, group].forEach((button) => expect(button).toBeEnabled());

        await user.click(edit);
        await user.click(page);
        await user.click(dataTable);
        await user.click(group);
        expect(callbacks.onEditRole).toHaveBeenCalledWith(2);
        expect(callbacks.onManagePagePermissions).toHaveBeenCalledWith(2, 'editors');
        expect(callbacks.onManageDataTablePermissions).toHaveBeenCalledWith(2, 'editors');
        expect(callbacks.onManageGroupPermissions).toHaveBeenCalledWith(2, 'editors');

        await user.click(within(row).getByLabelText('More actions'));
        const deleteItem = await menuItem('Delete Role');
        expect(deleteItem).not.toHaveAttribute('data-disabled');
        await user.click(deleteItem);
        expect(callbacks.onDeleteRole).toHaveBeenCalledWith(2, 'editors');
    });

    it('disables Edit, all three grant buttons and Delete when both flags are false', async () => {
        const user = userEvent.setup();
        const callbacks = handlers();
        renderWithProviders(<RolesList {...callbacks} />);

        const row = rowOf('above_me');
        const edit = within(row).getByLabelText('Edit role');
        expect(edit).toBeDisabled();

        // A locked grant button is named after the reason, like the full-access role's.
        const grants = within(row).getAllByLabelText(REASON_NOT_HELD);
        expect(grants).toHaveLength(3);
        grants.forEach((button) => expect(button).toBeDisabled());

        await user.click(edit);
        for (const button of grants) {
            await user.click(button);
        }
        expect(callbacks.onEditRole).not.toHaveBeenCalled();
        expect(callbacks.onManagePagePermissions).not.toHaveBeenCalled();
        expect(callbacks.onManageDataTablePermissions).not.toHaveBeenCalled();
        expect(callbacks.onManageGroupPermissions).not.toHaveBeenCalled();

        await user.click(within(row).getByLabelText('More actions'));
        const deleteItem = await menuItem(REASON_NOT_HELD);
        expect(deleteItem).toHaveAttribute('data-disabled', 'true');
        await user.click(deleteItem);
        expect(callbacks.onDeleteRole).not.toHaveBeenCalled();
    });

    it('keeps Edit on and gives the reason on Delete for a role that still has users', async () => {
        const user = userEvent.setup();
        renderWithProviders(<RolesList {...handlers()} />);

        const row = rowOf('with_users');
        expect(within(row).getByLabelText('Edit role')).toBeEnabled();
        expect(within(row).getByLabelText('Manage Page Permissions')).toBeEnabled();

        await user.click(within(row).getByLabelText('More actions'));
        const deleteItem = await menuItem(REASON_HAS_USERS);
        expect(deleteItem).toHaveAttribute('data-disabled', 'true');
    });

    it('leaves the full-access role as before: editable by a superuser, never granted to or deleted', async () => {
        const user = userEvent.setup();
        renderWithProviders(<RolesList {...handlers()} />);

        const row = rowOf('Owners');
        expect(within(row).getByLabelText('Edit role')).toBeEnabled();
        const grants = within(row).getAllByLabelText(REASON_SUPERUSER_GRANTS);
        expect(grants).toHaveLength(3);
        grants.forEach((button) => expect(button).toBeDisabled());

        await user.click(within(row).getByLabelText('More actions'));
        const deleteItem = await menuItem(REASON_SUPERUSER_DELETE);
        expect(deleteItem).toHaveAttribute('data-disabled', 'true');
    });

    it('says which right is missing when the person lacks admin.role.update or admin.role.delete', async () => {
        const user = userEvent.setup();
        state.held = new Set([PERMISSIONS.ADMIN_ROLE_READ]);
        state.roles = [role({ id: 5, name: 'plain', can_update: false, can_delete: false })];
        renderWithProviders(<RolesList {...handlers()} />);

        const row = rowOf('plain');
        expect(within(row).getByLabelText('Edit role')).toBeDisabled();
        const grants = within(row).getAllByLabelText(REASON_NEEDS_UPDATE);
        expect(grants).toHaveLength(3);

        await user.click(within(row).getByLabelText('More actions'));
        const deleteItem = await menuItem(REASON_NEEDS_DELETE);
        expect(deleteItem).toHaveAttribute('data-disabled', 'true');
    });

    it('treats a role without the flags as not allowed, so a button never guesses', async () => {
        const user = userEvent.setup();
        // An answer from a server that does not send the flags.
        state.roles = [
            { ...role({ id: 6, name: 'unflagged' }), can_update: undefined, can_delete: undefined } as unknown as IRoleDetails,
        ];
        renderWithProviders(<RolesList {...handlers()} />);

        const row = rowOf('unflagged');
        expect(within(row).getByLabelText('Edit role')).toBeDisabled();
        await user.click(within(row).getByLabelText('More actions'));
        const deleteItem = await menuItem(REASON_NOT_HELD);
        expect(deleteItem).toHaveAttribute('data-disabled', 'true');
    });
});
