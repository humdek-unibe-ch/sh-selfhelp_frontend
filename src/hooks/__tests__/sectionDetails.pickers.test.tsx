/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';

/**
 * F56: the section details carry the group, data-table and page pickers, read per request. A write
 * that changes one of those lists (a group, a data table, a page) must mark the cached section
 * details stale, so the next time the inspector is opened it does not offer what is gone.
 */
const api = vi.hoisted(() => ({
    createGroup: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
    deleteTable: vi.fn(),
    updateTableDisplayName: vi.fn(),
}));

vi.mock('../../api/admin/group.api', () => ({
    AdminGroupApi: {
        createGroup: api.createGroup,
        updateGroup: api.updateGroup,
        deleteGroup: api.deleteGroup,
    },
}));
vi.mock('../../api/admin/data.api', () => ({
    AdminDataApi: {
        deleteTable: api.deleteTable,
        updateTableDisplayName: api.updateTableDisplayName,
    },
}));
vi.mock('@mantine/notifications', () => ({ notifications: { show: vi.fn() } }));

import { useCreateGroup, useDeleteGroup, useUpdateGroup } from '../useGroups';
import { useDeleteTable, useUpdateTableDisplayName } from '../useData';

const DETAILS_KEY = ['admin', 'sections', 'details', 12, 55];

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
    queryClient.setQueryData(DETAILS_KEY, { section: { id: 55 } });
    queryClient.setQueryData(['unrelated'], 'keep');
    Object.values(api).forEach((mock) => mock.mockReset().mockResolvedValue({ success: true }));
});

const detailsStale = () => queryClient.getQueryState(DETAILS_KEY)?.isInvalidated;

describe('the section details after a write that changes a picker list (F56)', () => {
    it('the registry root names the cached details', () => {
        expect(REACT_QUERY_CONFIG.QUERY_KEYS.SECTION_DETAILS_ALL).toEqual(['admin', 'sections', 'details']);
    });

    it('creating a group', async () => {
        const { result } = renderHook(() => useCreateGroup(), { wrapper });
        await act(() => result.current.mutateAsync({ name: 'staff' }));

        expect(detailsStale()).toBe(true);
        expect(queryClient.getQueryState(['unrelated'])?.isInvalidated).toBe(false);
    });

    it('renaming a group', async () => {
        const { result } = renderHook(() => useUpdateGroup(), { wrapper });
        await act(() => result.current.mutateAsync({ groupId: 3, data: { name: 'team' } }));

        expect(detailsStale()).toBe(true);
    });

    it('deleting a group', async () => {
        const { result } = renderHook(() => useDeleteGroup(), { wrapper });
        await act(() => result.current.mutateAsync(3));

        expect(detailsStale()).toBe(true);
    });

    it('deleting a data table', async () => {
        const { result } = renderHook(() => useDeleteTable(), { wrapper });
        await act(() => result.current.mutateAsync({ tableName: 'orders' }));

        expect(detailsStale()).toBe(true);
    });

    it('renaming a data table', async () => {
        const { result } = renderHook(() => useUpdateTableDisplayName(), { wrapper });
        await act(() => result.current.mutateAsync({ tableName: 'orders', body: { display_name: 'Orders' } as never }));

        expect(detailsStale()).toBe(true);
    });
});
