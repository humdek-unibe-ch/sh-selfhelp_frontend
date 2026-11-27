/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type { IGroupsListResponse } from '../../../../../../types/responses/admin/groups.types';

// F239 least-privilege walk: a person who may only read groups sees no write control.
const state = vi.hoisted(() => ({ held: new Set<string>(), canUpdate: true, canDelete: true }));

const group = {
    id: 7,
    name: 'qa_access_group',
    description: null,
    add_to_new_pages: false,
    requires_2fa: false,
    users_count: 0,
    acls: [],
};

const groupsResponse: IGroupsListResponse = {
    groups: [{ ...group, can_update: true, can_delete: true }],
    pagination: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1, hasNext: false, hasPrevious: false },
};

vi.mock('../../../../../../hooks/useGroups', () => ({
    useGroups: () => ({
        data: { ...groupsResponse, groups: [{ ...group, can_update: state.canUpdate, can_delete: state.canDelete }] },
        refetch: vi.fn(),
        isFetching: false,
        error: null,
    }),
}));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission: (name: string) => state.held.has(name) } }),
}));

import { GroupsList } from '../GroupsList';

describe('GroupsList write controls follow the rights of their routes', () => {
    beforeEach(() => {
        state.held = new Set(['admin.access', 'admin.group.read']);
        state.canUpdate = true;
        state.canDelete = true;
    });

    it('shows no create, edit or delete control to a read-only person', async () => {
        const user = userEvent.setup();
        renderWithProviders(<GroupsList />);

        expect(await screen.findByText('qa_access_group')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Create Group' })).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Edit group')).not.toBeInTheDocument();

        await user.click(screen.getByLabelText('More actions'));
        expect(await screen.findByText('View members')).toBeInTheDocument();
        expect(screen.queryByText('Delete group')).not.toBeInTheDocument();
    });

    it('shows each control to the holder of its own right', async () => {
        const user = userEvent.setup();
        state.held = new Set(['admin.access', 'admin.group.read', 'admin.group.create', 'admin.group.update', 'admin.group.delete']);
        renderWithProviders(<GroupsList />);

        expect(await screen.findByRole('button', { name: 'Create Group' })).toBeInTheDocument();
        expect(screen.getByLabelText('Edit group')).toBeInTheDocument();
        await user.click(screen.getByLabelText('More actions'));
        expect(await screen.findByText('Delete group')).toBeInTheDocument();
    });

    it('treats update and create as separate rights', async () => {
        state.held = new Set(['admin.access', 'admin.group.read', 'admin.group.update']);
        renderWithProviders(<GroupsList />);

        expect(await screen.findByLabelText('Edit group')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Create Group' })).not.toBeInTheDocument();
    });

    it('hides Edit and Delete on a group the person may only view, although the route rights are held', async () => {
        const user = userEvent.setup();
        state.held = new Set(['admin.access', 'admin.group.read', 'admin.group.update', 'admin.group.delete']);
        state.canUpdate = false;
        state.canDelete = false;
        renderWithProviders(<GroupsList />);

        expect(await screen.findByText('qa_access_group')).toBeInTheDocument();
        expect(screen.queryByLabelText('Edit group')).not.toBeInTheDocument();
        await user.click(screen.getByLabelText('More actions'));
        expect(await screen.findByText('View members')).toBeInTheDocument();
        expect(screen.queryByText('Delete group')).not.toBeInTheDocument();
    });
});
