/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Loader, Select, Stack, Text } from '@mantine/core';
import { useMemo } from 'react';
import { useTableColumns } from '../../../../../hooks/useData';
import { useResolvedDataTableName } from './useResolvedDataTableName';
import { buildColumnSelectOptions } from './column-option.utils';

interface IDataTableColumnSelectFieldProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function DataTableColumnSelectField({
    value,
    onChange,
    disabled = false,
    placeholder = 'No default sort (optional)',
}: IDataTableColumnSelectFieldProps) {
    const { tableName, isLoading: isTablesLoading, needsDataTable } = useResolvedDataTableName();
    const { data: columnsResp, isLoading: isColumnsLoading } = useTableColumns(tableName);

    const options = useMemo(() => {
        return buildColumnSelectOptions(columnsResp?.columns ?? []);
    }, [columnsResp?.columns]);

    const isLoading = isTablesLoading || (Boolean(tableName) && isColumnsLoading);

    if (needsDataTable) {
        return (
            <Text size="sm" c="dimmed">
                Select a data table first to choose a sort column.
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

    return (
        <Select
            data={options}
            value={value.trim() !== '' ? value : null}
            onChange={(next) => onChange(next ?? '')}
            placeholder={placeholder}
            searchable
            clearable
            disabled={disabled}
        />
    );
}
