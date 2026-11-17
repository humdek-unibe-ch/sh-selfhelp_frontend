/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useLiveFormListSource } from '../form-list/useLiveFormListSource';
import { useSectionFormStore } from '../../../../../store/sectionFormStore';
import type { IFormListSource } from '../../../../../../types/responses/admin/admin.types';

vi.mock('../../../../../../hooks/useData', () => ({
    useDataTables: () => ({
        data: {
            dataTables: [
                { id: 7, name: '120', display_name: 'Own list' },
                { id: 99, name: '55', display_name: 'Participant items' },
            ],
        },
        isLoading: false,
    }),
    useTableColumns: (tableName?: string) => ({
        data: tableName === '55'
            ? {
                columns: [
                    { id: 1, fieldKey: 'section_10', displayName: 'title', locked: false, isFile: false },
                    { id: 2, fieldKey: 'section_11', displayName: 'status', locked: false, isFile: false },
                    { id: null, fieldKey: 'entry_date', displayName: 'Entry date', locked: false, standard: true, isFile: false },
                ],
            }
            : undefined,
        isLoading: false,
    }),
}));

const SAVED: IFormListSource = {
    data_table: { id: 7, name: '120' },
    form_section_id: 120,
    columns: [{ field: 'section_1', label: 'note', type: 'text' }],
    row_fields: [
        { field: 'entry_date', label: 'Entry date', type: 'datetime', column: true, sort: true, filter: true },
    ],
};

function wrapper({ children }: { children: ReactNode }) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useLiveFormListSource', () => {
    beforeEach(() => {
        useSectionFormStore.getState().reset();
    });

    it('keeps the saved source when Data table is unchanged', () => {
        useSectionFormStore.getState().setPropertyField('data_table', '7');
        const { result } = renderHook(() => useLiveFormListSource(SAVED), { wrapper });
        expect(result.current).toEqual(SAVED);
    });

    it('offers the pending foreign table columns before save', async () => {
        useSectionFormStore.getState().setPropertyField('data_table', '99');
        const { result } = renderHook(() => useLiveFormListSource(SAVED), { wrapper });

        await waitFor(() => {
            expect(result.current?.data_table).toEqual({ id: 99, name: '55' });
        });
        expect(result.current?.form_section_id).toBeNull();
        expect(result.current?.columns.map((column) => column.label)).toEqual(['title', 'status']);
        expect(result.current?.columns.every((column) => column.field.startsWith('section_'))).toBe(true);
    });
});
