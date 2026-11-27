/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * P4-A6: content_ref display on the admin data browser and history.
 * The grid hides the column by default; the history always shows it.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import { AdminDataHistoryModal } from '../modals/AdminDataHistoryModal';
import SingleDataTable from '../tables/SingleDataTable';

const historyMock = vi.fn();

vi.mock('../../../../../api/admin/data-history.api', () => ({
    AdminDataHistoryApi: {
        history: (...args: unknown[]) => historyMock(...args),
        version: vi.fn(),
        restore: vi.fn(),
    },
}));

vi.mock('../../../../../hooks/useData', () => ({
    useDataRows: () => ({
        data: {
            rows: [
                { record_id: 1, content_ref: 'page:7@v3', name: 'a' },
                { record_id: 2, content_ref: null, name: 'b' },
            ],
        },
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
    }),
    useTableColumns: () => ({ data: { columns: [{ fieldKey: 'name', displayName: 'Name', isFile: false }] } }),
    useDeleteRecord: () => ({ mutate: vi.fn(), isPending: false }),
    useDeleteTable: () => ({ mutate: vi.fn(), isPending: false }),
    useExportTable: () => ({ mutate: vi.fn(), isPending: false }),
    useDeleteColumns: () => ({ mutate: vi.fn(), isPending: false }),
    useUpdateColumnDisplayName: () => ({ mutate: vi.fn(), isPending: false }),
    useUpdateTableDisplayName: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../../../../../hooks/useDataTableOptionLabelMaps', () => ({
    useDataTableOptionLabelMaps: () => ({ data: {} }),
}));

vi.mock('../../../../../hooks/useLanguages', () => ({
    usePublicLanguages: () => ({ languages: [] }),
}));

describe('content_ref display (P4-A6)', () => {
    beforeEach(() => {
        historyMock.mockReset();
    });

    it('shows content_ref on a row after the meta column is revealed, and unknown for null', async () => {
        renderWithProviders(
            <SingleDataTable
                formId={1}
                tableName="section_1"
                displayName="Form"
                selectedUserId={-1}
                showDeleted={false}
                selectedLanguageId={2}
            />,
        );

        expect(screen.queryByTestId('content-ref-cell')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('checkbox', { name: 'Show content version' }));
        const cells = await screen.findAllByTestId('content-ref-cell');
        expect(cells[0]).toHaveTextContent('page:7@v3');
        expect(cells[1]).toHaveTextContent('unknown');
    });

    it('shows content_ref per history revision', async () => {
        historyMock.mockResolvedValue({
            record_id: 9,
            current_version: 2,
            total: 2,
            page: 1,
            page_size: 20,
            items: [
                {
                    version: 2,
                    operation: 'update',
                    source: 'form',
                    actor: null,
                    impersonated_by: null,
                    changed_fields: 1,
                    created_at: '2026-11-26T00:00:00Z',
                    restored_from_version: null,
                    is_checkpoint: false,
                    content_ref: 'page:7@v3',
                },
                {
                    version: 1,
                    operation: 'create',
                    source: 'form',
                    actor: null,
                    impersonated_by: null,
                    changed_fields: 1,
                    created_at: '2026-11-25T00:00:00Z',
                    restored_from_version: null,
                    is_checkpoint: false,
                    content_ref: null,
                },
            ],
        });

        renderWithProviders(
            <AdminDataHistoryModal opened onClose={vi.fn()} tableName="section_1" recordId={9} expectedVersion={2} />,
        );

        await waitFor(() => expect(screen.getAllByTestId('content-ref-revision')).toHaveLength(2));
        expect(screen.getAllByTestId('content-ref-revision')[0]).toHaveTextContent('Content version: page:7@v3');
        expect(screen.getAllByTestId('content-ref-revision')[1]).toHaveTextContent('Content version: unknown');
    });
});
