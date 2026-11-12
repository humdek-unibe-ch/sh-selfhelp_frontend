/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * The group and role pickers must offer EVERY row. The list endpoints serve at
 * most 100 rows per request and reset a larger `pageSize` to 20 (they do not clamp
 * it), so the old `useGroups({ pageSize: 1000 })` pickers silently showed 20 groups.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAllGroups } from '../useGroups';
import { useAllRoles } from '../useRoles';
import { AdminGroupApi } from '../../api/admin/group.api';
import { AdminRoleApi } from '../../api/admin/role.api';
import type { IGroupDetails, IGroupsListResponse } from '../../types/responses/admin/groups.types';
import type { IRoleDetails, IRolesListResponse } from '../../types/responses/admin/roles.types';

function wrapper(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

function newClient(): QueryClient {
    return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function pagination(page: number, pageSize: number, totalCount: number) {
    const totalPages = Math.ceil(totalCount / pageSize);
    return { page, pageSize, totalCount, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 };
}

function group(id: number): IGroupDetails {
    return { id, name: `group-${id}`, description: null, add_to_new_pages: false, requires_2fa: false, users_count: 0, acls: [] };
}

function role(id: number): IRoleDetails {
    return { id, name: `role-${id}`, description: null, permissions: [], users_count: 0, permissions_count: 0 };
}

/** 230 rows served the way the backend serves them: 100 per page at most. */
function serveGroups(): void {
    const all = Array.from({ length: 230 }, (_, index) => group(index + 1));
    vi.spyOn(AdminGroupApi, 'getGroups').mockImplementation(async (params = {}) => {
        const page = params.page ?? 1;
        const pageSize = params.pageSize ?? 20;
        const response: IGroupsListResponse = {
            groups: all.slice((page - 1) * pageSize, page * pageSize),
            pagination: pagination(page, pageSize, all.length),
        };
        return response;
    });
}

function serveRoles(): void {
    const all = Array.from({ length: 130 }, (_, index) => role(index + 1));
    vi.spyOn(AdminRoleApi, 'getRoles').mockImplementation(async (params = {}) => {
        const page = params.page ?? 1;
        const pageSize = params.pageSize ?? 20;
        const response: IRolesListResponse = {
            roles: all.slice((page - 1) * pageSize, page * pageSize),
            pagination: pagination(page, pageSize, all.length),
        };
        return response;
    });
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useAllGroups', () => {
    it('reads every page, so a picker offers all 230 groups instead of the first 20', async () => {
        serveGroups();
        const { result } = renderHook(() => useAllGroups(), { wrapper: wrapper(newClient()) });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.groups).toHaveLength(230);
        expect(result.current.data?.groups[0].id).toBe(1);
        expect(result.current.data?.groups[229].id).toBe(230);
        expect(AdminGroupApi.getGroups).toHaveBeenCalledTimes(3);
        // The page size the backend honours, ordered by name for the picker.
        expect(AdminGroupApi.getGroups).toHaveBeenNthCalledWith(1, { page: 1, pageSize: 100, sort: 'name', sortDirection: 'asc' });
        expect(AdminGroupApi.getGroups).toHaveBeenNthCalledWith(3, { page: 3, pageSize: 100, sort: 'name', sortDirection: 'asc' });
    });

    it('is refreshed by the same invalidation that refreshes the group lists', async () => {
        serveGroups();
        const queryClient = newClient();
        const { result } = renderHook(() => useAllGroups(), { wrapper: wrapper(queryClient) });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(AdminGroupApi.getGroups).toHaveBeenCalledTimes(3);

        // What useCreateGroup / useUpdateGroup / useDeleteGroup do after a change.
        await queryClient.invalidateQueries({ queryKey: ['groups'] });

        await waitFor(() => expect(AdminGroupApi.getGroups).toHaveBeenCalledTimes(6));
    });

    it('reads nothing while it is disabled (an always-mounted dialog that is closed), and everything once enabled', async () => {
        serveGroups();
        const { result, rerender } = renderHook(({ enabled }) => useAllGroups({ enabled }), {
            wrapper: wrapper(newClient()),
            initialProps: { enabled: false },
        });

        // Give a wrongly-enabled query the chance to fire before asserting it did not.
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(AdminGroupApi.getGroups).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);

        rerender({ enabled: true });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data?.groups).toHaveLength(230);
    });
});

describe('useAllRoles', () => {
    it('reads every page, so a picker offers all 130 roles instead of the first 20', async () => {
        serveRoles();
        const { result } = renderHook(() => useAllRoles(), { wrapper: wrapper(newClient()) });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.roles).toHaveLength(130);
        expect(AdminRoleApi.getRoles).toHaveBeenCalledTimes(2);
        expect(AdminRoleApi.getRoles).toHaveBeenNthCalledWith(2, { page: 2, pageSize: 100, sort: 'name', sortDirection: 'asc' });
    });

    it('is refreshed by the same invalidation that refreshes the role lists', async () => {
        serveRoles();
        const queryClient = newClient();
        const { result } = renderHook(() => useAllRoles(), { wrapper: wrapper(queryClient) });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(AdminRoleApi.getRoles).toHaveBeenCalledTimes(2);

        await queryClient.invalidateQueries({ queryKey: ['roles'] });

        await waitFor(() => expect(AdminRoleApi.getRoles).toHaveBeenCalledTimes(4));
    });

    it('reads nothing while it is disabled (an always-mounted dialog that is closed), and everything once enabled', async () => {
        serveRoles();
        const { result, rerender } = renderHook(({ enabled }) => useAllRoles({ enabled }), {
            wrapper: wrapper(newClient()),
            initialProps: { enabled: false },
        });

        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(AdminRoleApi.getRoles).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);

        rerender({ enabled: true });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data?.roles).toHaveLength(130);
    });
});
