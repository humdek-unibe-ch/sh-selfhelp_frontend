/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../test-utils/renderWithProviders';

/**
 * The export hooks wire mutation → blob download → success/error notification.
 * The API, the download side-effect, and the notification system are all mocked
 * (canonical Testing Rule 11/30 — no real outbound, no real DOM download) so the
 * test pins exactly that wiring: the right API call, a download on success with
 * a sensibly-named file, and an error notification on rejection.
 */
const { exportTable, exportTablesZip, downloadBlobFile, generateExportFilename, notifyShow } = vi.hoisted(() => ({
    exportTable: vi.fn(),
    exportTablesZip: vi.fn(),
    downloadBlobFile: vi.fn(),
    generateExportFilename: vi.fn((prefix: string, ext: string) => `${prefix}.${ext}`),
    notifyShow: vi.fn(),
}));

vi.mock('../../api/admin/data.api', () => ({
    AdminDataApi: { exportTable, exportTablesZip },
}));
vi.mock('../../utils/export-import.utils', () => ({
    downloadBlobFile,
    generateExportFilename,
}));
vi.mock('@mantine/notifications', () => ({
    notifications: { show: notifyShow },
}));

import { useExportTable, useExportTablesZip } from '../useData';

function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

describe('useExportTable', () => {
    beforeEach(() => {
        exportTable.mockReset();
        downloadBlobFile.mockReset();
        notifyShow.mockReset();
    });

    it('calls the API with the table + params and downloads the returned blob', async () => {
        const blob = new Blob(['a,b\n1,2'], { type: 'text/csv' });
        exportTable.mockResolvedValue(blob);

        const { result } = renderHook(() => useExportTable(), { wrapper });
        result.current.mutate({
            tableName: '218',
            displayName: 'Survey',
            params: { format: 'csv', user_id: 7, exclude_deleted: true },
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(exportTable).toHaveBeenCalledWith('218', { format: 'csv', user_id: 7, exclude_deleted: true });
        // Filename uses the display name + format.
        expect(generateExportFilename).toHaveBeenCalledWith('Survey', 'csv');
        expect(downloadBlobFile).toHaveBeenCalledWith(blob, 'Survey.csv');
        expect(notifyShow).toHaveBeenCalledWith(expect.objectContaining({ color: 'green' }));
    });

    it('falls back to the table name for the filename when no display name is given', async () => {
        exportTable.mockResolvedValue(new Blob(['x']));

        const { result } = renderHook(() => useExportTable(), { wrapper });
        result.current.mutate({ tableName: '218', params: { format: 'json' } });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(generateExportFilename).toHaveBeenCalledWith('218', 'json');
    });

    it('shows an error notification and does not download when the export fails', async () => {
        exportTable.mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() => useExportTable(), { wrapper });
        result.current.mutate({ tableName: '218', params: { format: 'csv' } });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(downloadBlobFile).not.toHaveBeenCalled();
        expect(notifyShow).toHaveBeenCalledWith(expect.objectContaining({ color: 'red' }));
    });
});

describe('useExportTablesZip', () => {
    beforeEach(() => {
        exportTablesZip.mockReset();
        downloadBlobFile.mockReset();
        notifyShow.mockReset();
    });

    it('posts the bulk body and downloads a single zip named data_tables', async () => {
        const zip = new Blob([new Uint8Array([1, 2, 3])], { type: 'application/zip' });
        exportTablesZip.mockResolvedValue(zip);

        const { result } = renderHook(() => useExportTablesZip(), { wrapper });
        result.current.mutate({ table_names: ['218', '219'], format: 'csv' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(exportTablesZip).toHaveBeenCalledWith({ table_names: ['218', '219'], format: 'csv' });
        expect(generateExportFilename).toHaveBeenCalledWith('data_tables', 'zip');
        expect(downloadBlobFile).toHaveBeenCalledWith(zip, 'data_tables.zip');
        expect(notifyShow).toHaveBeenCalledWith(expect.objectContaining({ color: 'green' }));
    });

    it('notifies on failure without downloading', async () => {
        exportTablesZip.mockRejectedValue(new Error('nope'));

        const { result } = renderHook(() => useExportTablesZip(), { wrapper });
        result.current.mutate({ table_names: ['218'], format: 'json' });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(downloadBlobFile).not.toHaveBeenCalled();
        expect(notifyShow).toHaveBeenCalledWith(expect.objectContaining({ color: 'red' }));
    });
});
