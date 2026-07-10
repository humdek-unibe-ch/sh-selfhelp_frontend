/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Loader, MultiSelect, Select, Stack, Text } from '@mantine/core';
import { useMemo } from 'react';
import { useTableColumns } from '../../../../../hooks/useData';
import { useResolvedDataTableName } from './useResolvedDataTableName';
import { buildColumnSelectOptions, withMissingColumnOptions } from './column-option.utils';

export type TDataTableColumnSelectMode = 'single' | 'multiple';

interface IDataTableColumnSelectFieldProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    /**
     * `single` — one column (e.g. default sort).
     * `multiple` — comma-separated catalog (entry-list `selected_columns`).
     */
    mode?: TDataTableColumnSelectMode;
    placeholder?: string;
    emptyHint?: string;
}

function parseSelectedColumns(raw: string): string[] {
    return raw
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part !== '');
}

/**
 * Shared data-table column picker for inspector fields that select one or
 * many columns from the section's resolved `data_table`.
 *
 * Ordered column catalogs with per-locale header labels use {@link FieldsMapField}
 * (`fields_map` / `fields_map_labels` on entry-table) — that is a different
 * contract, not a second MultiSelect.
 */
export function DataTableColumnSelectField({
    value,
    onChange,
    disabled = false,
    mode = 'single',
    placeholder,
    emptyHint,
}: IDataTableColumnSelectFieldProps) {
    const { tableName, isLoading: isTablesLoading, needsDataTable } = useResolvedDataTableName();
    const { data: columnsResp, isLoading: isColumnsLoading } = useTableColumns(tableName);
    const selected = useMemo(
        () => (mode === 'multiple' ? parseSelectedColumns(value) : []),
        [mode, value],
    );

    const options = useMemo(() => {
        const base = buildColumnSelectOptions(columnsResp?.columns ?? []);
        return mode === 'multiple' ? withMissingColumnOptions(base, selected) : base;
    }, [columnsResp?.columns, mode, selected]);

    const isLoading = isTablesLoading || (Boolean(tableName) && isColumnsLoading);

    if (needsDataTable) {
        return (
            <Text size="sm" c="dimmed">
                {emptyHint ?? (mode === 'multiple'
                    ? 'Select a data table first to choose columns.'
                    : 'Select a data table first to choose a sort column.')}
            </Text>
        );
    }

    if (isLoading) {
        return (
            <Stack gap="xs">
                <Loader size="sm" />
            </Stack>
        );
    }

    if (mode === 'multiple') {
        return (
            <MultiSelect
                data={options}
                value={selected}
                onChange={(next) => onChange(next.join(','))}
                placeholder={placeholder ?? 'All columns (default)'}
                searchable
                clearable
                disabled={disabled}
            />
        );
    }

    return (
        <Select
            data={options}
            value={value.trim() !== '' ? value : null}
            onChange={(next) => onChange(next ?? '')}
            placeholder={placeholder ?? 'No default sort (optional)'}
            searchable
            clearable
            disabled={disabled}
        />
    );
}

/** @deprecated Prefer {@link DataTableColumnSelectField} with `mode="multiple"`. */
export function SelectedColumnsField(props: Omit<IDataTableColumnSelectFieldProps, 'mode'>) {
    return <DataTableColumnSelectField {...props} mode="multiple" />;
}
