/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useCallback, useState } from 'react';
import { Button, Stack } from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';
import { FieldLabelWithTooltip } from '../../ui/field-label-with-tooltip/FieldLabelWithTooltip';
import { FilterBuilderInline } from '../data-config-modal/FilterBuilderInline';
import { MonacoEditorField } from './MonacoEditorField';

interface IEntryFilterFieldProps {
    fieldId: number;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    dataVariables?: Record<string, string>;
    help?: string | null;
}

export function EntryFilterField({
    fieldId,
    value,
    onChange,
    disabled = false,
    dataVariables,
    help,
}: IEntryFilterFieldProps) {
    const [filterOpened, setFilterOpened] = useState(false);

    const handleSaveFilter = useCallback(
        (payload: { sql: string }) => {
            onChange(payload.sql);
        },
        [onChange],
    );

    return (
        <Stack gap="xs">
            <FieldLabelWithTooltip
                label="Filter"
                tooltip={help ?? 'SQL WHERE fragment applied when loading data table rows. Route tokens like {{route.record_id}} are validated server-side.'}
            />
            <Button
                variant="light"
                size="xs"
                leftSection={<IconFilter size={14} />}
                onClick={() => setFilterOpened((open) => !open)}
                disabled={disabled}
            >
                {filterOpened ? 'Hide' : 'Show'} SQL builder
            </Button>
            {filterOpened && (
                <FilterBuilderInline
                    initialSql={value}
                    onSave={handleSaveFilter}
                    dataVariables={dataVariables}
                />
            )}
            <MonacoEditorField
                fieldId={fieldId}
                value={value}
                onChange={onChange}
                language="sql"
                height={160}
                disabled={disabled}
                dataVariables={dataVariables}
            />
        </Stack>
    );
}
