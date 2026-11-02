/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import type { ReactNode } from 'react';
import { useCleanUserData, USER_QUERY_KEYS } from '../useUsers';
import { AdminUserApi } from '../../api/admin/user.api';
import type { ICleanUserDataResult } from '../../types/responses/admin/users.types';

function wrapper(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

/** Runs the mutation with a stubbed API response and returns the toast message. */
async function cleanWith(result: ICleanUserDataResult) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.spyOn(AdminUserApi, 'cleanUserData').mockResolvedValue(result);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result: hook } = renderHook(() => useCleanUserData(), {
        wrapper: wrapper(queryClient),
    });
    hook.current.mutate(7);
    await waitFor(() => expect(hook.current.isSuccess).toBe(true));

    const show = vi.mocked(notifications.show);
    const message = show.mock.calls.at(-1)?.[0]?.message;
    return { message, invalidate };
}

describe('useCleanUserData', () => {
    beforeEach(() => {
        vi.spyOn(notifications, 'show').mockImplementation(() => '');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('reports what was actually removed so the admin can check it', async () => {
        const { message } = await cleanWith({
            cleaned: true,
            removed: {
                scheduled_job_recipients: 2,
                scheduled_jobs: 3,
                data_cells: 18,
                data_rows: 7,
                transactions: 42,
            },
        });

        expect(message).toContain('42 activity entries');
        expect(message).toContain('7 data records');
        expect(message).toContain('3 scheduled actions');
        expect(message).toContain('The user account was kept');
    });

    it('says plainly when there was nothing to remove, rather than a bare success', async () => {
        const { message } = await cleanWith({ cleaned: true, removed: {} });
        expect(message).toBe('This user had no data to remove. The account is unchanged.');
    });

    it('omits zero counts instead of reporting "0 data records"', async () => {
        const { message } = await cleanWith({
            cleaned: true,
            removed: { transactions: 1, data_rows: 0 },
        });

        expect(message).toContain('1 activity entry');
        expect(message).not.toContain('data record');
    });

    it('degrades to the empty summary when the body carries no counts', async () => {
        const { message } = await cleanWith({ cleaned: true });
        expect(message).toBe('This user had no data to remove. The account is unchanged.');
    });

    it('refetches the users list and the cleaned user so the Activity column drops', async () => {
        const { invalidate } = await cleanWith({ cleaned: true, removed: { transactions: 5 } });

        expect(invalidate).toHaveBeenCalledWith({ queryKey: USER_QUERY_KEYS.lists() });
        expect(invalidate).toHaveBeenCalledWith({ queryKey: USER_QUERY_KEYS.detail(7) });
    });
});
