/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { createTestQueryClient } from '../../test-utils/renderWithProviders';
import { PreviewModeProvider } from '../../app/components/contexts/PreviewModeContext';

/**
 * The history, the versions, the comparison and the restore of a record act on the page version the
 * person looks at: the draft in preview mode, the published page otherwise. The server judges each of
 * these reads and writes by that version, so a draft that allows history must be read as a draft, and a
 * draft and a published answer never share one cache entry.
 */
const api = vi.hoisted(() => ({
    getHistory: vi.fn(),
    getVersion: vi.fn(),
    compare: vi.fn(),
    restore: vi.fn(),
    runQuickAction: vi.fn(),
    getState: vi.fn(),
    deleteForm: vi.fn(),
}));

vi.mock('../../api/frontend/form-list.api', () => ({
    FormListApi: {
        getHistory: api.getHistory,
        getVersion: api.getVersion,
        compare: api.compare,
        restore: api.restore,
        runQuickAction: api.runQuickAction,
        getState: api.getState,
    },
}));
vi.mock('../../api/frontend/form-submission.api', () => ({
    FormSubmissionApi: { deleteForm: api.deleteForm },
}));
vi.mock('../useUserData', () => ({ useAuthUser: () => ({ user: { id: 5 } }) }));

import {
    useFormListCompare,
    useFormListHistory,
    useFormListRestoreMutation,
    useFormListState,
    useFormListVersion,
} from '../useFormList';

let queryClient: QueryClient;
let previewMode = false;

function wrapper({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <PreviewModeProvider initialPreviewMode={previewMode}>{children}</PreviewModeProvider>
        </QueryClientProvider>
    );
}

const TARGET = { pageId: 11, sectionId: 21, recordId: 4 };

beforeEach(() => {
    queryClient = createTestQueryClient();
    previewMode = false;
    api.getHistory.mockReset().mockResolvedValue({ items: [], total: 0, page: 1, page_size: 10, current_version: 1 });
    api.getVersion.mockReset().mockResolvedValue({ version: 1 });
    api.compare.mockReset().mockResolvedValue({ from_version: 1, to_version: 2 });
    api.restore.mockReset().mockResolvedValue({ dry_run: true });
});

describe('reads of a record history', () => {
    it('name the draft in preview mode', async () => {
        previewMode = true;
        const history = renderHook(() => useFormListHistory(TARGET, 1), { wrapper });
        const version = renderHook(() => useFormListVersion(TARGET, 2), { wrapper });
        const compare = renderHook(() => useFormListCompare(TARGET, 1, 2), { wrapper });

        await waitFor(() => expect(history.result.current.isSuccess).toBe(true));
        await waitFor(() => expect(version.result.current.isSuccess).toBe(true));
        await waitFor(() => expect(compare.result.current.isSuccess).toBe(true));

        expect(api.getHistory).toHaveBeenCalledWith(21, 4, { page_id: 11, page: 1, page_size: 10, preview: true });
        expect(api.getVersion).toHaveBeenCalledWith(21, 4, 2, 11, true);
        expect(api.compare).toHaveBeenCalledWith(21, 4, { page_id: 11, from: 1, to: 2, preview: true });
    });

    it('name no draft for the published page', async () => {
        const history = renderHook(() => useFormListHistory(TARGET, 1), { wrapper });
        const version = renderHook(() => useFormListVersion(TARGET, 2), { wrapper });
        const compare = renderHook(() => useFormListCompare(TARGET, 1, 2), { wrapper });

        await waitFor(() => expect(history.result.current.isSuccess).toBe(true));
        await waitFor(() => expect(version.result.current.isSuccess).toBe(true));
        await waitFor(() => expect(compare.result.current.isSuccess).toBe(true));

        expect(api.getHistory).toHaveBeenCalledWith(21, 4, { page_id: 11, page: 1, page_size: 10 });
        expect(api.getVersion).toHaveBeenCalledWith(21, 4, 2, 11, false);
        expect(api.compare).toHaveBeenCalledWith(21, 4, { page_id: 11, from: 1, to: 2 });
    });

    it('never share one cache entry between the draft and the published page', async () => {
        const published = renderHook(() => useFormListHistory(TARGET, 1), { wrapper });
        await waitFor(() => expect(published.result.current.isSuccess).toBe(true));
        expect(api.getHistory).toHaveBeenCalledTimes(1);

        previewMode = true;
        const draft = renderHook(() => useFormListHistory(TARGET, 1), { wrapper });
        await waitFor(() => expect(draft.result.current.isSuccess).toBe(true));

        expect(api.getHistory).toHaveBeenCalledTimes(2);
        expect(api.getHistory.mock.calls[1]?.[2]).toMatchObject({ preview: true });
    });
});

describe('the state of a list', () => {
    const stateOf = (marker: string) => ({ rows: [{ record_id: 1, values: { title: marker } }], pagination: { page: 1 } });
    const options: Parameters<typeof useFormListState>[0] = { pageId: 11, sectionId: 21, listKey: 'news', languageId: 2, search: '' };

    it('keeps the rows of the same list while the next page loads', async () => {
        const next = deferred();
        api.getState.mockReset().mockResolvedValueOnce(stateOf('page one')).mockReturnValueOnce(next.promise);

        const { result, rerender } = renderHook((props) => useFormListState(props), { wrapper, initialProps: options });
        await waitFor(() => expect(result.current.state).toEqual(stateOf('page one')));

        rerender({ ...options, search: '?news.page=2' });
        // The next page is on its way: the rows that are on screen stay until it arrives.
        expect(result.current.state).toEqual(stateOf('page one'));
        next.resolve(stateOf('page two'));
        await waitFor(() => expect(result.current.state).toEqual(stateOf('page two')));
    });

    it('never shows the published rows in place of the draft while the draft loads', async () => {
        const draft = deferred();
        api.getState.mockReset().mockResolvedValueOnce(stateOf('published')).mockReturnValueOnce(draft.promise);

        const { result, rerender } = renderHook((props) => useFormListState(props), { wrapper, initialProps: options });
        await waitFor(() => expect(result.current.state).toEqual(stateOf('published')));

        rerender({ ...options, preview: true });
        // A draft can answer differently (columns, filters, actions): nothing of the published list is shown for it.
        expect(result.current.state).toBeNull();
        expect(api.getState.mock.calls[1]?.[1]).toMatchObject({ preview: true });

        draft.resolve(stateOf('draft'));
        await waitFor(() => expect(result.current.state).toEqual(stateOf('draft')));
    });

    it('never shows the rows of another route of the page in place of this one', async () => {
        const other = deferred();
        api.getState.mockReset().mockResolvedValueOnce(stateOf('record 3')).mockReturnValueOnce(other.promise);

        const { result, rerender } = renderHook((props) => useFormListState(props), {
            wrapper,
            initialProps: { ...options, route: { record_id: '3' } },
        });
        await waitFor(() => expect(result.current.state).toEqual(stateOf('record 3')));

        rerender({ ...options, route: { record_id: '4' } });
        expect(result.current.state).toBeNull();
        expect(api.getState.mock.calls[1]?.[1]).toMatchObject({ route: { record_id: '4' } });

        other.resolve(stateOf('record 4'));
        await waitFor(() => expect(result.current.state).toEqual(stateOf('record 4')));
    });
});

/** A promise settled by hand, to hold a read open while the screen is checked. */
function deferred() {
    let resolve!: (value: unknown) => void;
    const promise = new Promise<unknown>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

describe('a restore', () => {
    it('acts on the draft in preview mode, the dry run and the real one', async () => {
        previewMode = true;
        const { result } = renderHook(() => useFormListRestoreMutation(11, 21), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({ recordId: 4, version: 2, expected_version: 5, dry_run: true });
            await result.current.mutateAsync({ recordId: 4, version: 2, expected_version: 5, dry_run: false });
        });

        expect(api.restore).toHaveBeenNthCalledWith(1, 21, 4, { version: 2, expected_version: 5, dry_run: true, page_id: 11, preview: true });
        expect(api.restore).toHaveBeenNthCalledWith(2, 21, 4, { version: 2, expected_version: 5, dry_run: false, page_id: 11, preview: true });
    });

    it('names no draft for the published page', async () => {
        const { result } = renderHook(() => useFormListRestoreMutation(11, 21), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({ recordId: 4, version: 2, expected_version: 5, dry_run: true });
        });

        expect(api.restore.mock.calls[0]?.[2]).not.toHaveProperty('preview');
    });
});
