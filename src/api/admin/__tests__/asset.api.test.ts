/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Contract guard for the admin asset API client, aligned to core 0.1.43:
 * uploads/edits send `group_ids`/`role_ids` comma-separated (empty = none, so
 * no groups = public; absent = default/unchanged) and `folder_id`, edit POSTs
 * multipart to the asset id, bulk groups/delete POST JSON, folders are
 * created (POST), saved (PUT) and deleted by id, export POSTs { asset_ids }
 * and reads a blob, import never overwrites.
 */
const { getMock, postMock, putMock, deleteMock } = vi.hoisted(() => ({
    getMock: vi.fn(),
    postMock: vi.fn(),
    putMock: vi.fn(),
    deleteMock: vi.fn(),
}));

vi.mock('../../base.api', () => ({
    permissionAwareApiClient: { get: getMock, post: postMock, put: putMock, delete: deleteMock },
}));

import { AdminAssetApi, type IImportAssetsResponse } from '../asset.api';
import { API_CONFIG } from '../../../config/api.config';

const formDataOf = (callIndex = 0): FormData => postMock.mock.calls[callIndex][1] as FormData;

describe('AdminAssetApi', () => {
    beforeEach(() => {
        getMock.mockReset();
        postMock.mockReset();
        postMock.mockResolvedValue({ data: { data: {} } });
    });

    it('filters the list by group id', async () => {
        getMock.mockResolvedValue({ data: { data: { assets: [], pagination: {} } } });

        await AdminAssetApi.getAssets({ page: 2, search: 'logo', group_id: 5 });

        expect(getMock).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.ADMIN_ASSETS_GET_ALL, {
            params: { page: '2', search: 'logo', group_id: '5' },
        });
    });

    it('uploads with a name label, alt and comma-separated groups, and no file name (the uuid is the file name)', async () => {
        const file = new File(['x'], 'photo.png', { type: 'image/png' });

        await AdminAssetApi.createAsset({ file, name: 'Team photo', alt: 'The team', group_ids: [2, 3] });

        const form = formDataOf();
        expect(postMock.mock.calls[0][0]).toBe(API_CONFIG.ENDPOINTS.ADMIN_ASSETS_CREATE);
        expect(form.get('file')).toBe(file);
        expect(form.get('name')).toBe('Team photo');
        expect(form.has('file_name')).toBe(false);
        expect(form.get('alt')).toBe('The team');
        expect(form.get('group_ids')).toBe('2,3');
        expect(form.has('overwrite')).toBe(false);
    });

    it('sends roles and the folder, with an empty folder meaning the top level', async () => {
        const file = new File(['x'], 'a.png');

        await AdminAssetApi.createAsset({ file, role_ids: [1, 5], folder_id: 10 });
        await AdminAssetApi.updateAsset(9, { role_ids: [], folder_id: null });

        expect(formDataOf(0).get('role_ids')).toBe('1,5');
        expect(formDataOf(0).get('folder_id')).toBe('10');
        expect(formDataOf(1).get('role_ids')).toBe('');
        expect(formDataOf(1).get('folder_id')).toBe('');
    });

    it('bulk moves assets into a folder, or to the top level with null', async () => {
        postMock.mockResolvedValue({ data: { data: { moved: 2 } } });

        const result = await AdminAssetApi.bulkMoveToFolder([1, 2], 10);
        await AdminAssetApi.bulkMoveToFolder([1], null);

        expect(postMock).toHaveBeenNthCalledWith(1, API_CONFIG.ENDPOINTS.ADMIN_ASSETS_BULK_FOLDER, { asset_ids: [1, 2], folder_id: 10 });
        expect(postMock).toHaveBeenNthCalledWith(2, API_CONFIG.ENDPOINTS.ADMIN_ASSETS_BULK_FOLDER, { asset_ids: [1], folder_id: null });
        expect(result.moved).toBe(2);
    });

    it('bulk deletes with a JSON body of asset ids', async () => {
        postMock.mockResolvedValue({ data: { data: { deleted: 2 } } });

        const result = await AdminAssetApi.bulkDeleteAssets([1, 2]);

        expect(postMock).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.ADMIN_ASSETS_BULK_DELETE, { asset_ids: [1, 2] });
        expect(result.deleted).toBe(2);
    });

    it('creates folders with POST, saves them with PUT to their id and deletes them by id', async () => {
        const folders = [{ id: 10, name: 'Team', parent_id: null }];
        postMock.mockResolvedValue({ data: { data: folders } });
        putMock.mockResolvedValue({ data: { data: folders } });
        deleteMock.mockResolvedValue({ data: { data: [] } });

        expect(await AdminAssetApi.saveFolder({ name: 'Team', parent_id: null })).toEqual(folders);
        await AdminAssetApi.saveFolder({ name: 'Team', parent_id: 3 }, 10);
        await AdminAssetApi.deleteFolder(10);

        expect(postMock).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.ADMIN_ASSET_FOLDERS_CREATE, { name: 'Team', parent_id: null });
        expect(putMock).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.ADMIN_ASSET_FOLDERS_UPDATE, { name: 'Team', parent_id: 3 }, 10);
        expect(deleteMock).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.ADMIN_ASSET_FOLDERS_DELETE, 10);
    });

    it('sends an empty group list as an empty string (public) and omits groups when unset', async () => {
        const file = new File(['x'], 'a.png');

        await AdminAssetApi.createAsset({ file, group_ids: [] });
        await AdminAssetApi.createAsset({ file });

        expect(formDataOf(0).get('group_ids')).toBe('');
        expect(formDataOf(1).has('group_ids')).toBe(false);
    });

    it('edits an asset by POSTing multipart to its id, with an optional replacement file', async () => {
        const replacement = new File(['new'], 'photo-v2.png');

        await AdminAssetApi.updateAsset(9, { file: replacement, alt: '' });

        const [endpoint, form, assetId, config] = postMock.mock.calls[0];
        expect(endpoint).toBe(API_CONFIG.ENDPOINTS.ADMIN_ASSETS_UPDATE);
        expect(assetId).toBe(9);
        expect((form as FormData).get('file')).toBe(replacement);
        expect((form as FormData).get('alt')).toBe('');
        expect((form as FormData).has('group_ids')).toBe(false);
        expect(config).toMatchObject({ headers: { 'Content-Type': 'multipart/form-data' } });
    });

    it('bulk adds or removes groups with a JSON body', async () => {
        postMock.mockResolvedValue({ data: { data: { updated: 2 } } });

        const result = await AdminAssetApi.bulkUpdateGroups({ asset_ids: [1, 2], group_ids: [4], mode: 'add' });

        expect(postMock).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.ADMIN_ASSETS_BULK_GROUPS, {
            asset_ids: [1, 2],
            group_ids: [4],
            mode: 'add',
        });
        expect(result.updated).toBe(2);
    });

    it('exports the selected assets as a blob, or everything with an empty body', async () => {
        const blob = new Blob(['zip'], { type: 'application/zip' });
        postMock.mockResolvedValue({ data: blob });

        const result = await AdminAssetApi.exportAssets({ asset_ids: [3, 4] });
        await AdminAssetApi.exportAssets();

        expect(postMock).toHaveBeenNthCalledWith(
            1,
            API_CONFIG.ENDPOINTS.ADMIN_ASSETS_EXPORT,
            { asset_ids: [3, 4] },
            expect.objectContaining({ responseType: 'blob' }),
        );
        expect(postMock).toHaveBeenNthCalledWith(
            2,
            API_CONFIG.ENDPOINTS.ADMIN_ASSETS_EXPORT,
            {},
            expect.objectContaining({ responseType: 'blob' }),
        );
        expect(result).toBe(blob);
    });

    it('imports a bundle as multipart without an overwrite option', async () => {
        const response: IImportAssetsResponse = {
            imported: 2,
            skipped: 1,
            errors: [{ file: 'files/bad', error: 'validation failed' }],
        };
        postMock.mockResolvedValue({ data: { data: response } });

        const file = new File(['zip'], 'assets.zip', { type: 'application/zip' });
        const result = await AdminAssetApi.importAssets(file);

        const form = formDataOf();
        expect(postMock.mock.calls[0][0]).toBe(API_CONFIG.ENDPOINTS.ADMIN_ASSETS_IMPORT);
        expect(form.get('file')).toBe(file);
        expect(form.has('overwrite')).toBe(false);
        expect(result.skipped).toBe(1);
    });
});
