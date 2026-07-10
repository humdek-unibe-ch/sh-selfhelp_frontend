/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Text } from '@mantine/core';
import { FilterBuilderInline } from '../data-config-modal/FilterBuilderInline';
import { useResolvedDataTableName } from './useResolvedDataTableName';
import { useSectionFormStore } from '../../../../store/sectionFormStore';

interface IEntryFilterFieldProps {
    value: string;
    onChange: (value: string) => void;
    dataVariables?: Record<string, string>;
    sectionId?: number;
}

export function EntryFilterField({
    value,
    onChange,
    dataVariables,
    sectionId,
}: IEntryFilterFieldProps) {
    const { tableName, needsDataTable } = useResolvedDataTableName();
    const dataTableId = useSectionFormStore((state) => String(state.properties.data_table ?? ''));
    const ownEntriesOnly = useSectionFormStore((state) => {
        const raw = state.properties.own_entries_only;
        if (raw === undefined || raw === '') {
            return true;
        }
        return raw === true || raw === '1' || raw === 'true';
    });

    if (needsDataTable) {
        return (
            <Text size="sm" c="dimmed">
                Select a data table first to build a filter.
            </Text>
        );
    }

    return (
        <FilterBuilderInline
            tableName={tableName}
            initialSql={value}
            onSave={(payload) => onChange(payload.sql)}
            dataVariables={dataVariables}
            sectionId={sectionId}
            dataTableId={dataTableId}
            ownEntriesOnly={ownEntriesOnly}
        />
    );
}
