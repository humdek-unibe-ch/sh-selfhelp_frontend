/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadBlobFile, generateExportFilename } from '../export-import.utils';

/**
 * `downloadBlobFile` is the single download path shared by every blob-based
 * export (registration codes CSV, per-table CSV/JSON, bulk ZIP). jsdom does not
 * implement the object-URL APIs, so we stub them and assert the anchor dance.
 */
describe('downloadBlobFile', () => {
    let createSpy: ReturnType<typeof vi.fn>;
    let revokeSpy: ReturnType<typeof vi.fn>;
    let clickSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        createSpy = vi.fn(() => 'blob:mock-url');
        revokeSpy = vi.fn();
        (URL as unknown as { createObjectURL: unknown }).createObjectURL = createSpy;
        (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = revokeSpy;
        // Don't actually navigate when the synthetic anchor is clicked.
        clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    });

    afterEach(() => {
        clickSpy.mockRestore();
    });

    it('creates an object URL, triggers a download with the given filename, and revokes it', () => {
        const blob = new Blob(['hello'], { type: 'text/csv' });

        downloadBlobFile(blob, 'my-export.csv');

        expect(createSpy).toHaveBeenCalledWith(blob);
        expect(clickSpy).toHaveBeenCalledTimes(1);
        expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('does not leave the temporary anchor in the document', () => {
        downloadBlobFile(new Blob(['x']), 'f.json');
        expect(document.querySelector('a[download]')).toBeNull();
    });
});

describe('generateExportFilename', () => {
    it('builds a prefixed, timestamped filename with the requested extension', () => {
        const name = generateExportFilename('data_tables', 'zip');
        expect(name).toMatch(/^data_tables_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.zip$/);
    });

    it('defaults the extension to json', () => {
        expect(generateExportFilename('codes')).toMatch(/\.json$/);
    });
});
