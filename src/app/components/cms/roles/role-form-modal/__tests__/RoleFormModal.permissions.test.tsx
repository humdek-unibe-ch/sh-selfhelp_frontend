/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';
import type { IPermission } from '../../../../../../api/admin/permission.api';
import type { IRoleDetails, IRolePermission } from '../../../../../../types/responses/admin/roles.types';

/**
 * The permission grid of the role form (one row per area, one column per action)
 * draws what the server says per caller: each box is named by the description and
 * the key (the key alone when there is no description), a permission the caller does not hold is locked
 * (`can_assign`), and the read right of an area stays ticked and locked while another
 * right of the area is ticked (`implied_read`, C2). The form leaves the permission
 * list out of the request when the caller may not change it.
 */
const permission = (overrides: Partial<IPermission> & Pick<IPermission, 'id' | 'name'>): IPermission => ({
    description: null,
    can_assign: true,
    implied_read: null,
    ...overrides,
});

const GROUP_READ = permission({ id: 1, name: 'admin.group.read', description: 'See groups' });
const GROUP_ACL = permission({
    id: 2,
    name: 'admin.group.acl',
    description: 'Change which pages a group sees',
    implied_read: 'admin.group.read',
});
const IMPERSONATE = permission({
    id: 3,
    name: 'admin.user.impersonate',
    description: 'Act as another user',
    can_assign: false,
    implied_read: 'admin.user.read',
});
const USER_READ = permission({ id: 4, name: 'admin.user.read', description: 'See users' });
const NO_DESCRIPTION = permission({ id: 5, name: 'plugin.custom.use', description: null });

/** What a role carries for one of those permissions. */
const carried = (item: IPermission): IRolePermission => ({
    id: item.id,
    name: item.name,
    description: item.description,
    resource: 'admin',
    action: item.name.split('.').at(-1) ?? '',
});

const REASON_NOT_HELD = 'You do not hold this permission yourself.';
const REASON_IMPLIED_READ = 'Included while another right of this area is ticked.';
const TEXT_NEEDS_PERMISSIONS = "Changing a role's permissions needs admin.role.permissions.";
const TEXT_ROLE_NOT_HELD = 'You can only change or delete a role whose rights you all hold.';

const state = vi.hoisted(() => ({
    permissions: [] as IPermission[],
    roleDetails: undefined as IRoleDetails | undefined,
    held: new Set<string>(),
    create: vi.fn(),
    update: vi.fn(),
}));

vi.mock('../../../../../../hooks/useRoles', () => ({
    useCreateRole: () => ({ mutateAsync: state.create, isPending: false }),
    useUpdateRole: () => ({ mutateAsync: state.update, isPending: false }),
    useRoleDetails: () => ({ data: state.roleDetails, isLoading: false }),
}));
vi.mock('../../../../../../hooks/usePermissions', () => ({
    usePermissions: () => ({ data: { permissions: state.permissions }, isLoading: false }),
}));
vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({
        permissionChecker: { hasPermission: (name: string) => state.held.has(name) },
    }),
}));

import { RoleFormModal } from '../RoleFormModal';

type User = ReturnType<typeof userEvent.setup>;

/** The box of one permission in the grid. */
const box = (name: RegExp | string) => screen.getByRole('checkbox', { name });
const search = () => screen.getByRole('textbox', { name: 'Search permissions' });
const toggle = (user: User, name: RegExp) => user.click(box(name));
const isLocked = (element: HTMLElement) => (element as HTMLInputElement).disabled;
const isTicked = (element: HTMLElement) => (element as HTMLInputElement).checked;
const typeRoleName = (user: User, name: string) => user.type(screen.getByRole('textbox', { name: /Role Name/ }), name);

const roleDetails = (overrides: Partial<IRoleDetails> = {}): IRoleDetails => ({
    id: 9,
    name: 'qa_scoped',
    description: 'Scoped role',
    is_superuser: false,
    permissions: [carried(GROUP_READ)],
    users_count: 0,
    permissions_count: 1,
    can_update: true,
    can_delete: true,
    ...overrides,
});

describe('RoleFormModal permission picker', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Element.prototype.scrollIntoView = vi.fn();
        state.permissions = [GROUP_READ, GROUP_ACL, IMPERSONATE, USER_READ, NO_DESCRIPTION];
        state.roleDetails = undefined;
        state.held = new Set([PERMISSIONS.ADMIN_ROLE_CREATE, PERMISSIONS.ADMIN_ROLE_UPDATE, PERMISSIONS.ADMIN_ROLE_PERMISSIONS]);
        state.create.mockResolvedValue({});
        state.update.mockResolvedValue({});
    });

    describe('layout and search', () => {
        it('lays permissions out by area, with the action column or the Other cell', () => {
            renderWithProviders(<RoleFormModal opened onClose={vi.fn()} mode="create" />);

            const groupRow = screen.getByText('Group').closest('tr') as HTMLElement;
            expect(groupRow).toContainElement(box('See groups (admin.group.read)'));
            expect(groupRow).toContainElement(box('Change which pages a group sees (admin.group.acl)'));
            // An action without a column shows its word next to the box.
            expect(groupRow).toHaveTextContent('acl');
        });

        it('names a box by the key alone when the permission has no description', () => {
            renderWithProviders(<RoleFormModal opened onClose={vi.fn()} mode="create" />);

            expect(box('plugin.custom.use')).toBeInTheDocument();
        });

        it('finds an area by a description or a key, and the search stays while boxes are ticked', async () => {
            const user = userEvent.setup();
            renderWithProviders(<RoleFormModal opened onClose={vi.fn()} mode="create" />);

            await user.type(search(), 'acl');
            expect(box(/Change which pages a group sees/)).toBeInTheDocument();
            expect(screen.queryByRole('checkbox', { name: /See users/ })).not.toBeInTheDocument();

            await toggle(user, /Change which pages a group sees/);
            expect(search()).toHaveValue('acl');
            expect(isTicked(box(/Change which pages a group sees/))).toBe(true);

            await user.clear(search());
            await user.type(search(), 'See users');
            expect(box(/See users/)).toBeInTheDocument();
            expect(screen.queryByRole('checkbox', { name: /Change which pages a group sees/ })).not.toBeInTheDocument();
        });
    });

    describe('locks (P5-A2)', () => {
        it('locks a permission the caller does not hold, says why, and cannot add it', async () => {
            const user = userEvent.setup();
            renderWithProviders(<RoleFormModal opened onClose={vi.fn()} mode="create" />);
            await typeRoleName(user, 'qa_role');

            const locked = box(/Act as another user/);
            expect(isLocked(locked)).toBe(true);
            expect(locked).toHaveAccessibleDescription(REASON_NOT_HELD);

            await user.click(locked);
            expect(isTicked(box(/Act as another user/))).toBe(false);

            await user.click(screen.getByRole('button', { name: 'Create Role' }));
            await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));
            expect(state.create.mock.calls[0][0].permission_ids).toEqual([]);
        });

        it('ticks the read right of an area with another right of it, and locks it while that stays ticked', async () => {
            const user = userEvent.setup();
            renderWithProviders(<RoleFormModal opened onClose={vi.fn()} mode="create" />);
            await typeRoleName(user, 'qa_role');

            // Before: the read right is free.
            const readBefore = box(/See groups/);
            expect(isLocked(readBefore)).toBe(false);
            expect(isTicked(readBefore)).toBe(false);

            await toggle(user, /Change which pages a group sees/);

            const read = box(/See groups/);
            expect(isTicked(read)).toBe(true);
            expect(isLocked(read)).toBe(true);
            expect(read).toHaveAccessibleDescription(REASON_IMPLIED_READ);

            // A click on the locked read right changes nothing.
            await user.click(read);
            expect(isTicked(box(/See groups/))).toBe(true);

            // The request carries both ids: the server would add the read right as well.
            await user.click(screen.getByRole('button', { name: 'Create Role' }));
            await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));
            expect([...state.create.mock.calls[0][0].permission_ids].sort()).toEqual([1, 2]);
        });

        it('frees the read right again when the last other right of its area is unticked', async () => {
            const user = userEvent.setup();
            renderWithProviders(<RoleFormModal opened onClose={vi.fn()} mode="create" />);

            await toggle(user, /Change which pages a group sees/);
            expect(isLocked(box(/See groups/))).toBe(true);

            await toggle(user, /Change which pages a group sees/);

            const read = box(/See groups/);
            expect(isLocked(read)).toBe(false);
            // The read right stays ticked until the person unticks it themselves.
            expect(isTicked(read)).toBe(true);
            await user.click(read);
            expect(isTicked(box(/See groups/))).toBe(false);
        });

        it('adds the read right when a role arrives with an area right and no read right', async () => {
            const user = userEvent.setup();
            state.roleDetails = roleDetails({ permissions: [carried(GROUP_ACL)] });
            renderWithProviders(<RoleFormModal opened onClose={vi.fn()} mode="edit" roleId={9} />);

            const read = box(/See groups/);
            expect(isTicked(read)).toBe(true);
            expect(isLocked(read)).toBe(true);

            await user.click(screen.getByRole('button', { name: 'Update Role' }));
            await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1));
            expect(state.update.mock.calls[0][0].roleId).toBe(9);
            expect([...state.update.mock.calls[0][0].data.permission_ids].sort()).toEqual([1, 2]);
        });
    });

    describe('what the caller may change', () => {
        it('leaves the permission list out of the request when the caller lacks admin.role.permissions', async () => {
            const user = userEvent.setup();
            state.held = new Set([PERMISSIONS.ADMIN_ROLE_CREATE]);
            renderWithProviders(<RoleFormModal opened onClose={vi.fn()} mode="create" />);

            expect(box(/See groups/)).toBeDisabled();
            expect(screen.getByText(TEXT_NEEDS_PERMISSIONS)).toBeInTheDocument();

            await typeRoleName(user, 'qa_role');
            await user.click(screen.getByRole('button', { name: 'Create Role' }));

            await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));
            expect(state.create.mock.calls[0][0]).toEqual({ name: 'qa_role' });
            expect(state.create.mock.calls[0][0]).not.toHaveProperty('permission_ids');
        });

        it('shows a role the caller may not change read-only, with the server reason', () => {
            state.roleDetails = roleDetails({ can_update: false, can_delete: false });
            renderWithProviders(<RoleFormModal opened onClose={vi.fn()} mode="edit" roleId={9} />);

            expect(box(/See users/)).toBeDisabled();
            expect(screen.getByLabelText('Description')).toBeDisabled();
            expect(screen.getByRole('button', { name: 'Update Role' })).toBeDisabled();
            expect(screen.getByText(TEXT_ROLE_NOT_HELD)).toBeInTheDocument();
            expect(state.update).not.toHaveBeenCalled();
        });

        it('lets the caller change a role that carries the flag', async () => {
            const user = userEvent.setup();
            state.roleDetails = roleDetails();
            renderWithProviders(<RoleFormModal opened onClose={vi.fn()} mode="edit" roleId={9} />);

            expect(box(/See users/)).toBeEnabled();
            expect(screen.getByRole('button', { name: 'Update Role' })).toBeEnabled();

            await toggle(user, /See users/);
            await user.click(screen.getByRole('button', { name: 'Update Role' }));

            await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1));
            expect([...state.update.mock.calls[0][0].data.permission_ids].sort()).toEqual([1, 4]);
        });
    });
});
