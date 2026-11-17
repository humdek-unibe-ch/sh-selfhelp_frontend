/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useMemo } from 'react';
import { useDataTables, useTableColumns } from '../../../../../../hooks/useData';
import { useSectionFormStore } from '../../../../../store/sectionFormStore';
import type { IFormListSource, IFormListSourceRowField } from '../../../../../../types/responses/admin/admin.types';

/** Row fields every list may name; matches the backend catalog. */
const DEFAULT_ROW_FIELDS: IFormListSourceRowField[] = [
    { field: 'entry_date', label: 'Entry date', type: 'datetime', column: true, sort: true, filter: true },
    { field: 'record_id', label: 'Record number', type: 'number', column: false, sort: true, filter: true },
    { field: 'id_users', label: 'Author id', type: 'number', column: false, sort: false, filter: true },
    { field: 'user_name', label: 'Author name', type: 'text', column: false, sort: false, filter: true },
    { field: 'user_code', label: 'Author code', type: 'text', column: false, sort: false, filter: true },
];

/**
 * The fields the list editors offer: the saved `list_source`, or — when the
 * author has already chosen another **Data table** in the form but not saved —
 * that table's columns fetched live. Without this, a foreign-table admin list
 * cannot pick columns and quick actions in the same save that binds the table.
 */
export function useLiveFormListSource(saved: IFormListSource | null | undefined): IFormListSource | null {
    const pendingRaw = useSectionFormStore((state) => state.properties.data_table ?? '');
    const pendingId = parseTableId(pendingRaw);
    const savedId = saved?.data_table?.id ?? null;
    const needsLive = pendingId !== null && pendingId !== savedId;

    const { data: tablesResp } = useDataTables();
    const pendingTable = useMemo(() => {
        if (!needsLive || pendingId === null) {
            return null;
        }
        return tablesResp?.dataTables?.find((table) => table.id === pendingId) ?? null;
    }, [needsLive, pendingId, tablesResp]);

    const { data: columnsResp } = useTableColumns(needsLive ? pendingTable?.name : undefined);

    return useMemo(() => {
        if (!needsLive || pendingId === null) {
            return saved ?? null;
        }
        if (pendingTable === null) {
            // Table id chosen but list of tables not ready yet: keep the saved
            // source rather than emptying the pickers mid-type.
            return saved ?? null;
        }
        const columns = (columnsResp?.columns ?? [])
            .filter((column) => !column.standard && (column.fieldKey?.trim() ?? '') !== '')
            .map((column) => {
                const field = (column.fieldKey ?? '').trim();
                const label = (column.displayName?.trim() || field);
                return { field, label, type: column.isFile ? 'file' : 'text' };
            });

        return {
            data_table: { id: pendingId, name: pendingTable.name },
            form_section_id: null,
            columns,
            row_fields: saved?.row_fields?.length ? saved.row_fields : DEFAULT_ROW_FIELDS,
        };
    }, [needsLive, pendingId, pendingTable, columnsResp, saved]);
}

function parseTableId(raw: string | boolean): number | null {
    const text = String(raw).trim();
    if (text === '') {
        return null;
    }
    const id = Number.parseInt(text, 10);
    return Number.isFinite(id) && id > 0 ? id : null;
}
