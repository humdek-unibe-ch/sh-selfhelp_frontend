/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import type { ReactNode } from 'react';
import {
    USER_QUERY_KEYS,
    useBulkAddUsersToGroup,
    useBulkDeleteUsers,
    useBulkRemoveUsersFromGroup,
    useBulkSendActivation,
    useCleanUserData,
    useCreateUser,
    useSendActivationMail,
    useUpdateUser,
    useUser,
} from '../useUsers';
import { AdminUserApi } from '../../api/admin/user.api';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';
import type { IBulkOperationResult, IUserDetails } from '../../types/responses/admin/users.types';

/**
 * A mutation must refresh what its change touched, with the keys the readers
 * subscribe to. Two stale copies were dangerous, not just untidy:
 *
 * - the user edit form prefills from the cached user details, so after a bulk
 *   group change an outdated copy made the next save overwrite the new
 *   membership;
 * - a bulk action reports per-user results, and caches of users the backend
 *   REJECTED must not be thrown away as if they were gone.
 */
const QK = REACT_QUERY_CONFIG.QUERY_KEYS;

function newClient(): QueryClient {
    return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function wrapper(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

/** Users 1 and 2 went through; user 3 was rejected. */
const PARTIAL: IBulkOperationResult = { succeeded: [1, 2], failed: [{ id: 3, reason: 'Insufficient permissions' }] };

function userDetails(id: number, groupNames: string[]): IUserDetails {
    return {
        id,
        email: `user${id}@example.test`,
        name: null,
        user_name: `user${id}`,
        code: null,
        validation_code: null,
        id_languages: null,
        id_userTypes: null,
        blocked: false,
        receives_notifications: true,
        receives_emails: true,
        status: 'active',
        groups: groupNames.map((name, index) => ({ id: index + 1, name, description: null })),
        roles: [],
        created_at: '2026-11-03T10:00:00+00:00',
        updated_at: '2026-11-03T10:00:00+00:00',
    };
}

type TInvalidateSpy = MockInstance<QueryClient['invalidateQueries']>;

/** The query keys a mutation asked React Query to invalidate. */
function invalidatedKeys(spy: TInvalidateSpy): ReadonlyArray<readonly unknown[]> {
    return spy.mock.calls.map(([filters]) => filters?.queryKey ?? []);
}

function hasKey(keys: ReadonlyArray<readonly unknown[]>, expected: readonly unknown[]): boolean {
    return keys.some((key) => JSON.stringify(key) === JSON.stringify(expected));
}

beforeEach(() => {
    vi.spyOn(notifications, 'show').mockImplementation(() => '');
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('bulk group membership', () => {
    it.each([
        ['adds users to a group', () => useBulkAddUsersToGroup(), 'bulkAddUsersToGroup' as const],
        ['removes users from a group', () => useBulkRemoveUsersFromGroup(), 'bulkRemoveUsersFromGroup' as const],
    ])('refreshes the details of each user it %s, the lists and the group member counts', async (_label, useHook, apiMethod) => {
        vi.spyOn(AdminUserApi, apiMethod).mockResolvedValue(PARTIAL);
        const queryClient = newClient();
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
        const { result } = renderHook(() => useHook(), { wrapper: wrapper(queryClient) });

        result.current.mutate({ userIds: [1, 2, 3], groupIds: [9] });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const keys = invalidatedKeys(invalidate);
        // Succeeded users: details (the edit form's source) and their group list.
        expect(hasKey(keys, USER_QUERY_KEYS.detail(1))).toBe(true);
        expect(hasKey(keys, USER_QUERY_KEYS.detail(2))).toBe(true);
        expect(hasKey(keys, USER_QUERY_KEYS.groups(1))).toBe(true);
        expect(hasKey(keys, USER_QUERY_KEYS.groups(2))).toBe(true);
        // The rejected user was not changed.
        expect(hasKey(keys, USER_QUERY_KEYS.detail(3))).toBe(false);
        expect(hasKey(keys, USER_QUERY_KEYS.groups(3))).toBe(false);
        // The list the admin is looking at, and the member counts on the groups page.
        expect(hasKey(keys, USER_QUERY_KEYS.lists())).toBe(true);
        expect(hasKey(keys, QK.GROUPS_ALL)).toBe(true);
    });

    it('makes the edit form read the new membership instead of the cached details', async () => {
        const getUserById = vi.spyOn(AdminUserApi, 'getUserById')
            .mockResolvedValueOnce(userDetails(1, ['patients']))
            .mockResolvedValue(userDetails(1, ['patients', 'research']));
        vi.spyOn(AdminUserApi, 'bulkAddUsersToGroup').mockResolvedValue({ succeeded: [1], failed: [] });
        const queryClient = newClient();
        const { result } = renderHook(() => ({ user: useUser(1), add: useBulkAddUsersToGroup() }), { wrapper: wrapper(queryClient) });
        await waitFor(() => expect(result.current.user.isSuccess).toBe(true));
        expect(result.current.user.data?.groups.map((group) => group.name)).toEqual(['patients']);

        result.current.add.mutate({ userIds: [1], groupIds: [2] });

        // The details the form prefills from are refetched, so a save sends the full new membership.
        await waitFor(() => expect(result.current.user.data?.groups.map((group) => group.name)).toEqual(['patients', 'research']));
        expect(getUserById).toHaveBeenCalledTimes(2);
    });
});

describe('deleting users', () => {
    it('forgets only the users the backend deleted, and refreshes what lists them', async () => {
        vi.spyOn(AdminUserApi, 'bulkDeleteUsers').mockResolvedValue(PARTIAL);
        const queryClient = newClient();
        for (const id of [1, 2, 3]) {
            queryClient.setQueryData(USER_QUERY_KEYS.detail(id), userDetails(id, []));
        }
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
        const { result } = renderHook(() => useBulkDeleteUsers(), { wrapper: wrapper(queryClient) });

        result.current.mutate([1, 2, 3]);
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        // Gone: users 1 and 2. User 3 was rejected, still exists, and keeps its cached details.
        expect(queryClient.getQueryData(USER_QUERY_KEYS.detail(1))).toBeUndefined();
        expect(queryClient.getQueryData(USER_QUERY_KEYS.detail(2))).toBeUndefined();
        expect(queryClient.getQueryData(USER_QUERY_KEYS.detail(3))).toBeDefined();

        const keys = invalidatedKeys(invalidate);
        expect(hasKey(keys, USER_QUERY_KEYS.lists())).toBe(true);
        expect(hasKey(keys, USER_QUERY_KEYS.stats())).toBe(true);
        // Leaving every group and role changes the member counts; the data and jobs go too.
        expect(hasKey(keys, QK.GROUPS_ALL)).toBe(true);
        expect(hasKey(keys, QK.ROLES_ALL)).toBe(true);
        expect(hasKey(keys, QK.ADMIN_DATA_ROWS_ALL)).toBe(true);
        expect(hasKey(keys, QK.SCHEDULED_JOBS_ALL)).toBe(true);
        expect(hasKey(keys, QK.SCHEDULED_JOBS_CALENDAR_ALL)).toBe(true);
        expect(hasKey(keys, QK.SCHEDULED_JOBS_STATS)).toBe(true);
    });

    it('keeps every cached user when the backend deleted none', async () => {
        vi.spyOn(AdminUserApi, 'bulkDeleteUsers').mockResolvedValue({ succeeded: [], failed: [{ id: 1, reason: 'Cannot delete system users' }] });
        const queryClient = newClient();
        queryClient.setQueryData(USER_QUERY_KEYS.detail(1), userDetails(1, []));
        const { result } = renderHook(() => useBulkDeleteUsers(), { wrapper: wrapper(queryClient) });

        result.current.mutate([1]);
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(queryClient.getQueryData(USER_QUERY_KEYS.detail(1))).toBeDefined();
    });
});

describe('activation mails', () => {
    it('bulk: refreshes the users it reached (new validation code, new activity entry) and the lists', async () => {
        vi.spyOn(AdminUserApi, 'bulkSendActivation').mockResolvedValue(PARTIAL);
        const queryClient = newClient();
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
        const { result } = renderHook(() => useBulkSendActivation(), { wrapper: wrapper(queryClient) });

        result.current.mutate([1, 2, 3]);
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const keys = invalidatedKeys(invalidate);
        expect(hasKey(keys, USER_QUERY_KEYS.lists())).toBe(true);
        expect(hasKey(keys, USER_QUERY_KEYS.detail(1))).toBe(true);
        expect(hasKey(keys, USER_QUERY_KEYS.detail(2))).toBe(true);
        expect(hasKey(keys, USER_QUERY_KEYS.detail(3))).toBe(false);
    });

    it('single: refreshes the user and the lists', async () => {
        vi.spyOn(AdminUserApi, 'sendActivationMail').mockResolvedValue({ success: true });
        const queryClient = newClient();
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
        const { result } = renderHook(() => useSendActivationMail(), { wrapper: wrapper(queryClient) });

        result.current.mutate(7);
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const keys = invalidatedKeys(invalidate);
        expect(hasKey(keys, USER_QUERY_KEYS.lists())).toBe(true);
        expect(hasKey(keys, USER_QUERY_KEYS.detail(7))).toBe(true);
    });
});

describe('clean user data', () => {
    it('refreshes the Data browser rows and every scheduled-jobs view the erasure emptied', async () => {
        vi.spyOn(AdminUserApi, 'cleanUserData').mockResolvedValue({ cleaned: true, removed: { data_rows: 3, scheduled_jobs: 2 } });
        const queryClient = newClient();
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
        const { result } = renderHook(() => useCleanUserData(), { wrapper: wrapper(queryClient) });

        result.current.mutate(7);
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const keys = invalidatedKeys(invalidate);
        expect(hasKey(keys, QK.ADMIN_DATA_ROWS_ALL)).toBe(true);
        expect(hasKey(keys, QK.SCHEDULED_JOBS_ALL)).toBe(true);
        expect(hasKey(keys, QK.SCHEDULED_JOBS_CALENDAR_ALL)).toBe(true);
        expect(hasKey(keys, QK.SCHEDULED_JOBS_STATS)).toBe(true);
    });
});

describe('saving a user in the form', () => {
    function expectMemberCountsRefreshed(invalidate: TInvalidateSpy): void {
        const keys = invalidatedKeys(invalidate);
        expect(hasKey(keys, QK.GROUPS_ALL)).toBe(true);
        expect(hasKey(keys, QK.ROLES_ALL)).toBe(true);
        expect(hasKey(keys, USER_QUERY_KEYS.lists())).toBe(true);
    }

    it('creating a user (who starts with groups and roles) refreshes the member counts', async () => {
        vi.spyOn(AdminUserApi, 'createUser').mockResolvedValue(userDetails(7, ['patients']));
        const queryClient = newClient();
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
        const { result } = renderHook(() => useCreateUser(), { wrapper: wrapper(queryClient) });

        result.current.mutate({ email: 'a@example.test', user_name: 'a', validation_code: 'abc', group_ids: [1], role_ids: [2] });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expectMemberCountsRefreshed(invalidate);
    });

    it('updating a user (who may change groups and roles) refreshes the member counts', async () => {
        vi.spyOn(AdminUserApi, 'updateUser').mockResolvedValue(userDetails(7, ['patients']));
        const queryClient = newClient();
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
        const { result } = renderHook(() => useUpdateUser(), { wrapper: wrapper(queryClient) });

        result.current.mutate({ userId: 7, userData: { group_ids: [1], role_ids: [2] } });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expectMemberCountsRefreshed(invalidate);
    });
});
