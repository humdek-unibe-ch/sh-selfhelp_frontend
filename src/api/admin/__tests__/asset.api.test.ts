/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Contract guard for the admin asset API client's export/import methods,
 * aligned to the shipped backend: export POSTs { folders } and reads a blob,
 * import POSTs multipart with overwrite and returns imported/skipped/errors.
 * (Asset-folder ACLs are group-scoped and covered in group.api.test.ts.)
 */
const { getMock, postMock } = vi.hoisted(() => ({
    getMock: vi.fn(),
    postMock: vi.fn(),
}));

vi.mock('../../base.api', () => ({
    permissionAwareApiClient: { get: getMock, post: postMock },
}));

import { AdminAssetApi, type IImportAssetsResponse } from '../asset.api';
import { API_CONFIG } from '../../../config/api.config';

describe('AdminAssetApi export/import', () => {
    beforeEach(() => {
        getMock.mockReset();
        postMock.mockReset();
    });

    it('exports as a blob via POST with the folders body', async () => {
        const blob = new Blob(['zip'], { type: 'application/zip' });
        postMock.mockResolvedValue({ data: blob });

        const result = await AdminAssetApi.exportAssets({ folders: ['images', 'docs'] });

        expect(postMock).toHaveBeenCalledWith(
            API_CONFIG.ENDPOINTS.ADMIN_ASSETS_EXPORT,
            { folders: ['images', 'docs'] },
            expect.objectContaining({ responseType: 'blob' }),
        );
        expect(result).toBe(blob);
    });

    it('sends an empty body when exporting everything', async () => {
        postMock.mockResolvedValue({ data: new Blob([]) });

        await AdminAssetApi.exportAssets();

        expect(postMock).toHaveBeenCalledWith(
            API_CONFIG.ENDPOINTS.ADMIN_ASSETS_EXPORT,
            {},
            expect.objectContaining({ responseType: 'blob' }),
        );
    });

    it('posts import as multipart form-data and returns imported/skipped/errors', async () => {
        const response: IImportAssetsResponse = {
            imported: 2,
            skipped: 1,
            errors: [{ file: 'files/bad.svg', error: 'validation failed' }],
        };
        postMock.mockResolvedValue({ data: { data: response } });

        const file = new File(['zip'], 'assets.zip', { type: 'application/zip' });
        const result = await AdminAssetApi.importAssets(file, true);

        expect(postMock).toHaveBeenCalledTimes(1);
        const [endpoint, formData, config] = postMock.mock.calls[0];
        expect(endpoint).toBe(API_CONFIG.ENDPOINTS.ADMIN_ASSETS_IMPORT);
        expect(formData).toBeInstanceOf(FormData);
        expect((formData as FormData).get('file')).toBe(file);
        expect((formData as FormData).get('overwrite')).toBe('true');
        expect(config).toMatchObject({ headers: { 'Content-Type': 'multipart/form-data' } });
        expect(result.imported).toBe(2);
        expect(result.errors[0].file).toBe('files/bad.svg');
    });
});
