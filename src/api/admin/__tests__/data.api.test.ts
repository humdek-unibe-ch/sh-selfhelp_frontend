/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Contract guard for the admin data API client: export endpoints must request
 * blobs (they bypass the Symfony envelope), query params must map to the
 * documented names, the bulk POST must be detected as carrying an Axios config
 * (not a route param), and record delete must always send `table_name`.
 */
const { getMock, postMock, deleteMock } = vi.hoisted(() => ({
    getMock: vi.fn(),
    postMock: vi.fn(),
    deleteMock: vi.fn(),
}));

vi.mock('../../base.api', () => ({
    permissionAwareApiClient: { get: getMock, post: postMock, delete: deleteMock },
}));

import { AdminDataApi } from '../data.api';
import { API_CONFIG } from '../../../config/api.config';

describe('AdminDataApi', () => {
    beforeEach(() => {
        getMock.mockReset();
        postMock.mockReset();
        deleteMock.mockReset();
    });

    it('sends table_name as a query param when deleting a record', async () => {
        deleteMock.mockResolvedValue({ data: { data: { deleted: true } } });

        await AdminDataApi.deleteRecord(42, '218');

        expect(deleteMock).toHaveBeenCalledWith(
            API_CONFIG.ENDPOINTS.ADMIN_DATA_RECORD_DELETE,
            42,
            { params: { table_name: '218' } },
        );
    });

    it('adds own_entries_only=false only when explicitly disabled', async () => {
        deleteMock.mockResolvedValue({ data: { data: { deleted: true } } });

        await AdminDataApi.deleteRecord(42, '218', { own_entries_only: false });

        expect(deleteMock).toHaveBeenCalledWith(
            API_CONFIG.ENDPOINTS.ADMIN_DATA_RECORD_DELETE,
            42,
            { params: { table_name: '218', own_entries_only: 'false' } },
        );
    });

    it('exports a single table as a blob with mapped filters', async () => {
        const blob = new Blob(['a,b\n1,2'], { type: 'text/csv' });
        getMock.mockResolvedValue({ data: blob });

        const result = await AdminDataApi.exportTable('218', {
            format: 'csv',
            user_id: 7,
            language_id: 2,
            exclude_deleted: false,
        });

        expect(getMock).toHaveBeenCalledWith(
            API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLE_EXPORT,
            '218',
            {
                params: { format: 'csv', user_id: '7', language_id: '2', exclude_deleted: 'false' },
                responseType: 'blob',
            },
        );
        expect(result).toBe(blob);
    });

    it('omits optional filters from the single-table export when undefined', async () => {
        getMock.mockResolvedValue({ data: new Blob(['x']) });

        await AdminDataApi.exportTable('218', { format: 'json' });

        expect(getMock).toHaveBeenCalledWith(
            API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLE_EXPORT,
            '218',
            { params: { format: 'json' }, responseType: 'blob' },
        );
    });

    it('posts the bulk export body with an explicit empty params config', async () => {
        const zip = new Blob([new Uint8Array([1, 2, 3])], { type: 'application/zip' });
        postMock.mockResolvedValue({ data: zip });

        const result = await AdminDataApi.exportTablesZip({
            table_names: ['218', '219'],
            format: 'csv',
        });

        expect(postMock).toHaveBeenCalledWith(
            API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLES_EXPORT_BULK,
            { table_names: ['218', '219'], format: 'csv' },
            // `params: {}` is what makes the wrapper treat this as a config arg
            // rather than a route param — without it the POST would break.
            { params: {}, responseType: 'blob' },
        );
        expect(result).toBe(zip);
    });
});
