/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { getGroups, getAllGroups, getRoles, getAllRoles, getScheduledJobs, getScheduledJobsStats, getDataRows, getSectionDetails, plainReader } =
    vi.hoisted(() => ({
        getGroups: vi.fn(),
        getAllGroups: vi.fn(),
        getRoles: vi.fn(),
        getAllRoles: vi.fn(),
        getScheduledJobs: vi.fn(),
        getScheduledJobsStats: vi.fn(),
        getDataRows: vi.fn(),
        getSectionDetails: vi.fn(),
        plainReader: vi.fn(),
    }));

vi.mock('../../api/admin/group.api', () => ({ AdminGroupApi: { getGroups, getAllGroups } }));
vi.mock('../../api/admin/role.api', () => ({ AdminRoleApi: { getRoles, getAllRoles } }));
vi.mock('../../api/admin/scheduled-jobs.api', () => ({ AdminScheduledJobsApi: { getScheduledJobs, getScheduledJobsStats } }));
vi.mock('../../api/admin/data.api', () => ({ AdminDataApi: { getDataRows } }));
vi.mock('../../api/admin/section.api', () => ({ AdminSectionApi: { getSectionDetails } }));

import { useGroups, useAllGroups } from '../useGroups';
import { useRoles, useAllRoles } from '../useRoles';
import { useScheduledJobs, useScheduledJobsAll, useScheduledJobsStats } from '../useScheduledJobs';
import { useDataRows } from '../useData';
import { useSectionDetails } from '../useSectionDetails';
import { REACT_QUERY_CONFIG, refetchOnMountWhenInvalidated } from '../../config/react-query.config';

/**
 * The app's query client sets `refetchOnMount: false` for every query (data
 * hydrated by the server must not refetch on mount). A side effect is that an
 * invalidation made while a reader is NOT mounted is ignored when it mounts
 * again: the groups list, the scheduled jobs or the data rows stay as they were
 * before another page changed them, until a full reload.
 *
 * The readers that other pages invalidate therefore opt in with
 * `refetchOnMountWhenInvalidated`. These tests use the same client defaults as
 * the app (`REACT_QUERY_CONFIG.DEFAULT_OPTIONS`) and walk the real sequence:
 * the page is visited, left, something on another page invalidates the cache,
 * the page is visited again.
 */
const QK = REACT_QUERY_CONFIG.QUERY_KEYS;

interface IReader {
    name: string;
    api: Mock;
    value: unknown;
    /** The registry key a writer on ANOTHER page invalidates. */
    invalidatedBy: readonly unknown[];
    useReader: () => { isSuccess: boolean; fetchStatus: 'fetching' | 'paused' | 'idle' };
}

const PAGINATION = { page: 1, pageSize: 100, totalCount: 0, totalPages: 1, hasNext: false, hasPrevious: false };

const READERS: IReader[] = [
    { name: 'useGroups', api: getGroups, value: { groups: [], pagination: PAGINATION }, invalidatedBy: QK.GROUPS_ALL, useReader: () => useGroups({}) },
    { name: 'useAllGroups', api: getAllGroups, value: [], invalidatedBy: QK.GROUPS_ALL, useReader: () => useAllGroups() },
    { name: 'useRoles', api: getRoles, value: { roles: [], pagination: PAGINATION }, invalidatedBy: QK.ROLES_ALL, useReader: () => useRoles({}) },
    { name: 'useAllRoles', api: getAllRoles, value: [], invalidatedBy: QK.ROLES_ALL, useReader: () => useAllRoles() },
    { name: 'useScheduledJobs', api: getScheduledJobs, value: { scheduledJobs: [], totalCount: 0 }, invalidatedBy: QK.SCHEDULED_JOBS_ALL, useReader: () => useScheduledJobs({}) },
    { name: 'useScheduledJobsAll (calendar)', api: getScheduledJobs, value: { scheduledJobs: [], totalCount: 0 }, invalidatedBy: QK.SCHEDULED_JOBS_CALENDAR_ALL, useReader: () => useScheduledJobsAll({}) },
    { name: 'useScheduledJobsStats', api: getScheduledJobsStats, value: { total: 0, queued: 0, done: 0, failed: 0, deleted: 0 }, invalidatedBy: QK.SCHEDULED_JOBS_STATS, useReader: () => useScheduledJobsStats() },
    { name: 'useDataRows', api: getDataRows, value: { rows: [] }, invalidatedBy: QK.ADMIN_DATA_ROWS_ALL, useReader: () => useDataRows({ table_name: '218' }) },
    { name: 'useSectionDetails', api: getSectionDetails, value: { section: { id: 2 }, fields: [] }, invalidatedBy: QK.SECTION_DETAILS_ALL, useReader: () => useSectionDetails(1, 2) },
];

/** The client exactly as the app builds it (`src/providers/query-client.ts`). */
function appQueryClient(): QueryClient {
    return new QueryClient({ defaultOptions: REACT_QUERY_CONFIG.DEFAULT_OPTIONS });
}

function wrapper(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

afterEach(() => {
    for (const reader of READERS) {
        reader.api.mockReset();
    }
    plainReader.mockReset();
});

describe('refetchOnMountWhenInvalidated', () => {
    it('is true only for a query whose cache was invalidated', () => {
        expect(refetchOnMountWhenInvalidated({ state: { isInvalidated: true } })).toBe(true);
        expect(refetchOnMountWhenInvalidated({ state: { isInvalidated: false } })).toBe(false);
    });
});

describe('the global default ignores an invalidation made while the reader is unmounted', () => {
    // Control: documents the behaviour the helper works around. If React Query
    // ever changes it, this fails and the helper can be removed.
    it('a reader without the opt-in keeps its stale copy', async () => {
        plainReader.mockResolvedValue('v1');
        const queryClient = appQueryClient();
        const useReader = () => useQuery({ queryKey: [...QK.GROUPS_ALL, 'plain'], queryFn: () => plainReader() });

        const first = renderHook(() => useReader(), { wrapper: wrapper(queryClient) });
        await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
        first.unmount();

        await queryClient.invalidateQueries({ queryKey: QK.GROUPS_ALL });
        const second = renderHook(() => useReader(), { wrapper: wrapper(queryClient) });

        expect(second.result.current.fetchStatus).toBe('idle');
        expect(plainReader).toHaveBeenCalledTimes(1);
        queryClient.clear();
    });
});

describe.each(READERS)('$name', (reader) => {
    it('refetches at the next mount after another page invalidated it while it was unmounted', async () => {
        reader.api.mockResolvedValue(reader.value);
        const queryClient = appQueryClient();

        const first = renderHook(() => reader.useReader(), { wrapper: wrapper(queryClient) });
        await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
        expect(reader.api).toHaveBeenCalledTimes(1);
        first.unmount();

        // Nothing is mounted, so nothing refetches yet: the cache is only flagged.
        await queryClient.invalidateQueries({ queryKey: reader.invalidatedBy });
        expect(reader.api).toHaveBeenCalledTimes(1);

        const second = renderHook(() => reader.useReader(), { wrapper: wrapper(queryClient) });
        expect(second.result.current.fetchStatus).toBe('fetching');
        await waitFor(() => expect(reader.api).toHaveBeenCalledTimes(2));
        queryClient.clear();
    });

    it('uses the cached copy at the next mount when nothing invalidated it', async () => {
        reader.api.mockResolvedValue(reader.value);
        const queryClient = appQueryClient();

        const first = renderHook(() => reader.useReader(), { wrapper: wrapper(queryClient) });
        await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
        first.unmount();

        const second = renderHook(() => reader.useReader(), { wrapper: wrapper(queryClient) });

        expect(second.result.current.isSuccess).toBe(true);
        expect(second.result.current.fetchStatus).toBe('idle');
        expect(reader.api).toHaveBeenCalledTimes(1);
        queryClient.clear();
    });
});
