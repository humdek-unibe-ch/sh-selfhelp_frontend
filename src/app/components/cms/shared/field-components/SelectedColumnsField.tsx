/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useMemo } from 'react';
import { Loader, MultiSelect, Stack, Text } from '@mantine/core';
import { useDataTables, useTableColumns } from '../../../../../hooks/useData';
import { useSectionFormStore } from '../../../../store/sectionFormStore';
import { FieldLabelWithTooltip } from '../../ui/field-label-with-tooltip/FieldLabelWithTooltip';

interface ISelectedColumnsFieldProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    help?: string | null;
}

function parseSelectedColumns(raw: string): string[] {
    return raw
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part !== '');
}

export function SelectedColumnsField({
    value,
    onChange,
    disabled = false,
    help,
}: ISelectedColumnsFieldProps) {
    const dataTableId = useSectionFormStore((state) => state.properties.data_table ?? '');
    const { data: tablesResp, isLoading: isTablesLoading } = useDataTables();

    const tableName = useMemo(() => {
        const id = Number.parseInt(String(dataTableId), 10);
        if (!Number.isFinite(id) || id <= 0) {
            return undefined;
        }
        return tablesResp?.dataTables?.find((table) => table.id === id)?.name;
    }, [dataTableId, tablesResp]);

    const { data: columnsResp, isLoading: isColumnsLoading } = useTableColumns(tableName);

    const options = useMemo(() => {
        const columns = columnsResp?.columns ?? [];
        return columns
            .map((column) => {
                const fieldKey = column.fieldKey?.trim() ?? '';
                if (fieldKey === '') {
                    return null;
                }
                const label = column.displayName?.trim() || fieldKey;
                return { value: fieldKey, label };
            })
            .filter((option): option is { value: string; label: string } => option !== null);
    }, [columnsResp?.columns]);

    const selected = parseSelectedColumns(value);
    const isLoading = isTablesLoading || (Boolean(tableName) && isColumnsLoading);

    return (
        <Stack gap="xs">
            <FieldLabelWithTooltip
                label="Selected columns"
                tooltip={
                    help
                    ?? 'Optional subset of data columns to load. Leave empty to load all columns. Options refresh when the data table changes.'
                }
            />
            {!tableName ? (
                <Text size="sm" c="dimmed">
                    Select a data table first to choose columns.
                </Text>
            ) : isLoading ? (
                <Loader size="sm" />
            ) : (
                <MultiSelect
                    data={options}
                    value={selected}
                    onChange={(next) => onChange(next.join(','))}
                    placeholder="All columns (default)"
                    searchable
                    clearable
                    disabled={disabled}
                />
            )}
        </Stack>
    );
}
