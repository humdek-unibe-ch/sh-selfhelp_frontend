/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useMemo } from 'react';
import { useDataTables } from '../../../../../hooks/useData';
import { useSectionFormStore } from '../../../../store/sectionFormStore';

/**
 * Resolve the section inspector's `data_table` property to the backend table
 * name (the form section id string) used by the Data API column endpoints.
 */
export function useResolvedDataTableName(): {
    tableName: string | undefined;
    isLoading: boolean;
    needsDataTable: boolean;
} {
    const dataTableId = useSectionFormStore((state) => state.properties.data_table ?? '');
    const { data: tablesResp, isLoading: isTablesLoading } = useDataTables();

    const tableName = useMemo(() => {
        const raw = String(dataTableId).trim();
        if (raw === '') {
            return undefined;
        }
        const numericId = Number.parseInt(raw, 10);
        if (Number.isFinite(numericId) && numericId > 0) {
            return tablesResp?.dataTables?.find((table) => table.id === numericId)?.name;
        }
        return undefined;
    }, [dataTableId, tablesResp]);

    return {
        tableName,
        isLoading: isTablesLoading,
        needsDataTable: String(dataTableId).trim() === '',
    };
}
