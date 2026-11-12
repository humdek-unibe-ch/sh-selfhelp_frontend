/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type { IDataTableColumn } from '../../../../../../types/responses/admin/data.types';

/**
 * Which columns hold uploaded files is decided by the server (`isFile` on each
 * column), not guessed by the Data browser from a cell's value. A text answer
 * that merely looks like a storage path must stay text, and must not put its
 * record into the "All files (zip)" request.
 */
const STORED_PATH = 'uploads/form-files/user_1/section_4113/field_file/1793113614_5a2aa377_report.pdf';

const state = vi.hoisted(() => ({
    columns: [] as unknown[],
    rows: [] as Record<string, unknown>[],
}));

vi.mock('../../../../../../hooks/useData', () => ({
    useDataRows: () => ({ data: { rows: state.rows }, isLoading: false, isFetching: false, refetch: vi.fn() }),
    useTableColumns: () => ({ data: { columns: state.columns } }),
    useDeleteRecord: () => ({ mutate: vi.fn(), isPending: false }),
    useDeleteTable: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useExportTable: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('../../../../../../hooks/useDataTableOptionLabelMaps', () => ({
    useDataTableOptionLabelMaps: () => ({ data: {} }),
}));
vi.mock('../../../../../../hooks/useLanguages', () => ({
    usePublicLanguages: () => ({ languages: [] }),
}));
vi.mock('../../modals/DataTableEditorModal', () => ({ DataTableEditorModal: () => null }));
vi.mock('../../modals/ConfirmDeleteTableModal', () => ({ ConfirmDeleteTableModal: () => null }));

import SingleDataTable from '../SingleDataTable';

function column(fieldKey: string, isFile: boolean): IDataTableColumn {
    return { id: 1, fieldKey, displayName: fieldKey, locked: false, standard: false, isFile };
}

function renderTable() {
    return renderWithProviders(
        <SingleDataTable
            formId={7}
            tableName="0000004113"
            displayName="Contact"
            selectedUserId={-1}
            showDeleted={false}
            selectedLanguageId={1}
        />,
    );
}

describe('SingleDataTable file columns', () => {
    beforeEach(() => {
        state.columns = [column('upload', true), column('comment', false)];
        state.rows = [{ record_id: 165, upload: STORED_PATH, comment: 'see ' + STORED_PATH }];
    });

    it('draws file links in a column the server flags as a file column', async () => {
        renderTable();

        expect(await screen.findByRole('link', { name: 'View report.pdf' })).toHaveAttribute('href', '/api/forms/files/165/upload?index=0');
        expect(screen.getByRole('link', { name: 'Download report.pdf' })).toHaveAttribute('href', '/api/forms/files/165/upload?index=0');
    });

    it('keeps a path-looking value in a non-file column as plain text, without links to the file route', async () => {
        state.columns = [column('upload', false), column('comment', false)];
        state.rows = [{ record_id: 165, upload: STORED_PATH, comment: STORED_PATH }];
        renderTable();

        const cells = await screen.findAllByText(STORED_PATH);
        expect(cells).toHaveLength(2);
        expect(screen.queryByRole('link', { name: /view|download/i })).not.toBeInTheDocument();
    });

    it('offers "All files (zip)" only for records with uploads in a file column', async () => {
        state.columns = [column('upload', true), column('comment', false)];
        state.rows = [
            { record_id: 165, upload: STORED_PATH, comment: 'fine' },
            { record_id: 164, upload: null, comment: STORED_PATH },
        ];
        const user = userEvent.setup();
        renderTable();
        await screen.findByRole('link', { name: 'View report.pdf' });

        await user.click(screen.getByRole('button', { name: 'Export table' }));
        // By text, not by role: computing roles over the open menu is slow in jsdom.
        const zip = (await screen.findByText(/all files \(zip\)/i, {}, { timeout: 5000 })).closest('a');
        const href = zip?.getAttribute('href') ?? '';

        expect(href).toContain('165');
        expect(href).not.toContain('164');
    });

    it('offers no zip when no column is a file column, even if a cell looks like a path', async () => {
        state.columns = [column('comment', false)];
        state.rows = [{ record_id: 165, comment: STORED_PATH }];
        const user = userEvent.setup();
        renderTable();
        await screen.findByText(STORED_PATH);

        await user.click(screen.getByRole('button', { name: 'Export table' }));
        // The menu is open once its regular entries show; only then is the absence meaningful.
        await screen.findByText('CSV', {}, { timeout: 5000 });

        expect(screen.queryByText(/all files \(zip\)/i)).not.toBeInTheDocument();
    });
});
