/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { UserFormModal } from '../UserFormModal';
import { USER_QUERY_KEYS } from '../../../../../../hooks/useUsers';
import { AdminUserApi } from '../../../../../../api/admin/user.api';
import { REACT_QUERY_CONFIG } from '../../../../../../config/react-query.config';
import type { IUserDetails } from '../../../../../../types/responses/admin/users.types';

vi.mock('../../../../../../hooks/useGroups', () => ({
    useAllGroups: () => ({
        data: {
            groups: [
                { id: 1, name: 'patients' },
                { id: 2, name: 'research' },
            ],
        },
        isLoading: false,
    }),
}));

vi.mock('../../../../../../hooks/useRoles', () => ({
    useAllRoles: () => ({ data: { roles: [] }, isLoading: false }),
}));

/**
 * The edit form prefills from the cached user details and, on save, sends the
 * WHOLE group and role selection. When a bulk action on the Users page had
 * changed the user's groups, the form still showed the cached (old) membership,
 * and saving overwrote the change. The modal refreshes the details when it opens
 * for that user.
 *
 * The client below has the app's own defaults: cached details count as fresh for
 * a minute and are not refetched on mount, so the refresh on open is what makes
 * the form read the current membership.
 */
function detailsWithGroups(groups: Array<{ id: number; name: string }>): IUserDetails {
    return {
        id: 7,
        email: 'user7@example.test',
        name: 'User Seven',
        user_name: 'user7',
        code: null,
        validation_code: null,
        id_languages: null,
        id_userTypes: null,
        blocked: false,
        receives_notifications: true,
        receives_emails: true,
        status: 'active',
        groups: groups.map((group) => ({ ...group, description: null })),
        roles: [],
        created_at: '2026-11-03T10:00:00+00:00',
        updated_at: '2026-11-03T10:00:00+00:00',
    };
}

function appQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { ...REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries, retry: false },
            mutations: { retry: false },
        },
    });
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('UserFormModal (edit)', () => {
    it('shows the current group membership, not the cached copy a bulk action outdated', async () => {
        const getUserById = vi
            .spyOn(AdminUserApi, 'getUserById')
            .mockResolvedValue(detailsWithGroups([{ id: 1, name: 'patients' }, { id: 2, name: 'research' }]));
        const queryClient = appQueryClient();
        // What the Users page cached before the bulk "add to group research".
        queryClient.setQueryData(USER_QUERY_KEYS.detail(7), detailsWithGroups([{ id: 1, name: 'patients' }]));

        renderWithProviders(<UserFormModal opened mode="edit" userId={7} onClose={vi.fn()} />, { queryClient });

        // The refetched details bring the new membership into the form.
        expect(await screen.findByText('research', {}, { timeout: 4000 })).toBeInTheDocument();
        expect(getUserById).toHaveBeenCalledWith(7);
    }, 10_000);

    it('refreshes the key that the details reader subscribes to', async () => {
        vi.spyOn(AdminUserApi, 'getUserById').mockResolvedValue(detailsWithGroups([{ id: 1, name: 'patients' }]));
        const queryClient = appQueryClient();
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

        renderWithProviders(<UserFormModal opened mode="edit" userId={7} onClose={vi.fn()} />, { queryClient });

        await screen.findByText('Edit User', {}, { timeout: 4000 });
        expect(invalidate).toHaveBeenCalledWith({ queryKey: USER_QUERY_KEYS.detail(7) });
    }, 10_000);

    it('does not refresh any user in create mode', async () => {
        const getUserById = vi.spyOn(AdminUserApi, 'getUserById');
        const queryClient = appQueryClient();
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

        renderWithProviders(<UserFormModal opened mode="create" onClose={vi.fn()} />, { queryClient });

        await screen.findByText('Create New User', {}, { timeout: 4000 });
        expect(invalidate).not.toHaveBeenCalled();
        expect(getUserById).not.toHaveBeenCalled();
    }, 10_000);
});
