/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { formListCacheKey, type IFormListState } from '@selfhelp/shared';
import { PreviewModeProvider } from '../../app/components/contexts/PreviewModeContext';

/**
 * F186: a quick action answers with the record's new version. The next action on the same row
 * (Approve, then Delete) reads the version from the row, so it must be the new one at once,
 * not after the list was read again: the server refuses an old version with 409.
 */
const api = vi.hoisted(() => ({ runQuickAction: vi.fn() }));

vi.mock('../../api/frontend/form-list.api', () => ({ FormListApi: { runQuickAction: api.runQuickAction } }));
vi.mock('../../api/frontend/form-submission.api', () => ({ FormSubmissionApi: {} }));
vi.mock('../useUserData', () => ({ useAuthUser: () => ({ user: { id: 5 } }) }));

import { useFormListQuickActionMutation } from '../useFormList';

const PAGE = 11;
const SECTION = 21;

function key(sectionId: number) {
    return formListCacheKey(
        { apiBase: '/api', account: 5, languageId: 1, platform: 'web', pageId: PAGE, sectionId, key: 'orders', route: undefined },
        '',
    );
}

function state(versions: Record<number, number>): IFormListState {
    return {
        rows: Object.entries(versions).map(([id, version]) => ({ record_id: Number(id), version, values: {} })),
        selected: null,
    } as unknown as IFormListState;
}

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <PreviewModeProvider initialPreviewMode={false}>{children}</PreviewModeProvider>
        </QueryClientProvider>
    );
}

beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
    api.runQuickAction.mockReset();
});

describe('a quick action on a list row (F186)', () => {
    it('puts the version the action wrote into the cached row before the list is read again', async () => {
        queryClient.setQueryData(key(SECTION), state({ 7: 3, 8: 1 }));
        // The same record in another list of another section keeps its own version.
        queryClient.setQueryData(key(99), state({ 7: 3 }));
        api.runQuickAction.mockResolvedValue({ record_id: 7, version: 4, action: 'approve' });

        const { result } = renderHook(() => useFormListQuickActionMutation(PAGE, SECTION), { wrapper });
        await act(async () => {
            await result.current.mutateAsync({ recordId: 7, actionId: 'approve', expectedVersion: 3 });
        });

        const rows = queryClient.getQueryData<IFormListState>(key(SECTION))?.rows;
        expect(rows?.find((row) => row.record_id === 7)?.version).toBe(4);
        expect(rows?.find((row) => row.record_id === 8)?.version).toBe(1);
        expect(queryClient.getQueryData<IFormListState>(key(99))?.rows[0].version).toBe(3);
        // Still marked stale: the list is read again and has the last word.
        expect(queryClient.getQueryState(key(SECTION))?.isInvalidated).toBe(true);
    });

    it('a second action on the row sends the new version', async () => {
        queryClient.setQueryData(key(SECTION), state({ 7: 3 }));
        api.runQuickAction
            .mockResolvedValueOnce({ record_id: 7, version: 4, action: 'approve' })
            .mockResolvedValueOnce({ record_id: 7, version: 5, action: 'publish' });
        const { result } = renderHook(() => useFormListQuickActionMutation(PAGE, SECTION), { wrapper });

        const versionOfRow = () => queryClient.getQueryData<IFormListState>(key(SECTION))?.rows[0].version as number;

        await act(async () => {
            await result.current.mutateAsync({ recordId: 7, actionId: 'approve', expectedVersion: versionOfRow() });
        });
        await act(async () => {
            await result.current.mutateAsync({ recordId: 7, actionId: 'publish', expectedVersion: versionOfRow() });
        });

        expect(api.runQuickAction.mock.calls[0][3]).toMatchObject({ expected_version: 3 });
        expect(api.runQuickAction.mock.calls[1][3]).toMatchObject({ expected_version: 4 });
    });

    it('an answer without a version changes nothing but the stale mark', async () => {
        queryClient.setQueryData(key(SECTION), state({ 7: 3 }));
        api.runQuickAction.mockResolvedValue({ action: 'approve' });
        const { result } = renderHook(() => useFormListQuickActionMutation(PAGE, SECTION), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({ recordId: 7, actionId: 'approve', expectedVersion: 3 });
        });

        expect(queryClient.getQueryData<IFormListState>(key(SECTION))?.rows[0].version).toBe(3);
    });
});
