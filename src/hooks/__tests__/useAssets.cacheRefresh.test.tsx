/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { afterEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
    useBulkAssetGroups,
    useBulkDeleteAssets,
    useBulkMoveAssets,
    useCreateAsset,
    useDeleteAsset,
    useDeleteAssetFolder,
    useImportAssets,
    useSetAssetFolderAccess,
    useUpdateAsset,
} from '../useAssets';
import { AdminAssetApi, type IAsset } from '../../api/admin/asset.api';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';

/**
 * The image and video pickers of the section inspector are part of the section
 * details (the backend builds the option list per request), so every write
 * that adds, renames, re-shares or removes an asset must also refresh the cached
 * section details. Without it the inspector kept offering a deleted file, or
 * hid the one just uploaded, until a full page reload.
 *
 * Moving assets between folders and deleting a folder change no picker option,
 * so they refresh the asset caches only.
 */
const QK = REACT_QUERY_CONFIG.QUERY_KEYS;

type TInvalidateSpy = MockInstance<QueryClient['invalidateQueries']>;

function newClient(): QueryClient {
    return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function wrapper(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

function invalidatedKeys(spy: TInvalidateSpy): ReadonlyArray<readonly unknown[]> {
    return spy.mock.calls.map(([filters]) => filters?.queryKey ?? []);
}

function hasKey(keys: ReadonlyArray<readonly unknown[]>, expected: readonly unknown[]): boolean {
    return keys.some((key) => JSON.stringify(key) === JSON.stringify(expected));
}

const ASSET: IAsset = {
    id: 5,
    uuid: '00000000-0000-4000-8000-000000000005',
    name: 'logo.png',
    url: '/assets/00000000-0000-4000-8000-000000000005',
    mime_type: 'image/png',
    size: 10,
    alt: null,
    folder_id: null,
    roles: [],
    groups: [],
    can_view: true,
    can_update: true,
    can_delete: true,
    created_at: '2026-11-03T10:00:00+00:00',
    updated_at: '2026-11-03T10:00:00+00:00',
};

const FILE = new File(['x'], 'logo.png', { type: 'image/png' });

afterEach(() => {
    vi.restoreAllMocks();
});

describe('writes that change what an image or video picker offers', () => {
    async function runAndGetKeys(
        useHook: () => { mutate: (variables: never) => void; isSuccess: boolean },
        variables: unknown,
    ): Promise<ReadonlyArray<readonly unknown[]>> {
        const queryClient = newClient();
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
        const { result } = renderHook(() => useHook(), { wrapper: wrapper(queryClient) });

        result.current.mutate(variables as never);
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        return invalidatedKeys(invalidate);
    }

    it('uploading a file refreshes the asset lists and every cached section', async () => {
        vi.spyOn(AdminAssetApi, 'createAsset').mockResolvedValue(ASSET);
        const keys = await runAndGetKeys(() => useCreateAsset(), { file: FILE });

        expect(hasKey(keys, QK.ASSETS_ALL)).toBe(true);
        expect(hasKey(keys, QK.SECTION_DETAILS_ALL)).toBe(true);
    });

    it('editing an asset (name, groups, file) refreshes the asset lists and every cached section', async () => {
        vi.spyOn(AdminAssetApi, 'updateAsset').mockResolvedValue(ASSET);
        const keys = await runAndGetKeys(() => useUpdateAsset(), { assetId: 5, data: { name: 'new.png' } });

        expect(hasKey(keys, QK.ASSETS_ALL)).toBe(true);
        expect(hasKey(keys, QK.SECTION_DETAILS_ALL)).toBe(true);
    });

    it('changing groups in bulk refreshes the asset lists and every cached section', async () => {
        vi.spyOn(AdminAssetApi, 'bulkUpdateGroups').mockResolvedValue({ updated: 2 });
        const keys = await runAndGetKeys(() => useBulkAssetGroups(), { asset_ids: [5, 6], group_ids: [1], mode: 'add' });

        expect(hasKey(keys, QK.ASSETS_ALL)).toBe(true);
        expect(hasKey(keys, QK.SECTION_DETAILS_ALL)).toBe(true);
    });

    it('deleting an asset refreshes the asset lists and every cached section', async () => {
        vi.spyOn(AdminAssetApi, 'deleteAsset').mockResolvedValue({ success: true });
        const keys = await runAndGetKeys(() => useDeleteAsset(), 5);

        expect(hasKey(keys, QK.ASSETS_ALL)).toBe(true);
        expect(hasKey(keys, QK.SECTION_DETAILS_ALL)).toBe(true);
    });

    it('deleting assets in bulk refreshes the asset lists and every cached section', async () => {
        vi.spyOn(AdminAssetApi, 'bulkDeleteAssets').mockResolvedValue({ deleted: 2 });
        const keys = await runAndGetKeys(() => useBulkDeleteAssets(), [5, 6]);

        expect(hasKey(keys, QK.ASSETS_ALL)).toBe(true);
        expect(hasKey(keys, QK.SECTION_DETAILS_ALL)).toBe(true);
    });

    it('setting the access of a folder refreshes the asset lists and every cached section', async () => {
        vi.spyOn(AdminAssetApi, 'setFolderAccess').mockResolvedValue({ updated: 3 });
        const keys = await runAndGetKeys(() => useSetAssetFolderAccess(), { folderId: 3, access: { group_ids: [1] } });

        expect(hasKey(keys, QK.ASSETS_ALL)).toBe(true);
        expect(hasKey(keys, QK.SECTION_DETAILS_ALL)).toBe(true);
    });

    it('importing a bundle refreshes the asset lists and every cached section', async () => {
        vi.spyOn(AdminAssetApi, 'importAssets').mockResolvedValue({ imported: 1, skipped: 0, errors: [] });
        const keys = await runAndGetKeys(() => useImportAssets(), FILE);

        expect(hasKey(keys, QK.ASSETS_ALL)).toBe(true);
        expect(hasKey(keys, QK.SECTION_DETAILS_ALL)).toBe(true);
    });
});

describe('writes that change no picker option', () => {
    it('moving assets to a folder refreshes the asset lists only', async () => {
        vi.spyOn(AdminAssetApi, 'bulkMoveToFolder').mockResolvedValue({ moved: 2 });
        const queryClient = newClient();
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
        const { result } = renderHook(() => useBulkMoveAssets(), { wrapper: wrapper(queryClient) });

        result.current.mutate({ assetIds: [5, 6], folderId: 3 });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const keys = invalidatedKeys(invalidate);
        expect(hasKey(keys, QK.ASSETS_ALL)).toBe(true);
        expect(hasKey(keys, QK.SECTION_DETAILS_ALL)).toBe(false);
    });

    it('deleting a folder refreshes the asset lists only', async () => {
        vi.spyOn(AdminAssetApi, 'deleteFolder').mockResolvedValue([]);
        const queryClient = newClient();
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
        const { result } = renderHook(() => useDeleteAssetFolder(), { wrapper: wrapper(queryClient) });

        result.current.mutate(3);
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const keys = invalidatedKeys(invalidate);
        expect(hasKey(keys, QK.ASSETS_ALL)).toBe(true);
        expect(hasKey(keys, QK.SECTION_DETAILS_ALL)).toBe(false);
    });
});
