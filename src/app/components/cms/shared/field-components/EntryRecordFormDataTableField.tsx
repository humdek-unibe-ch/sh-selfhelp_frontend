/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Stack, Text } from '@mantine/core';
import { SelectField } from './SelectField';
import type { IFieldData } from '../field-renderer/FieldRenderer';
import type { ISectionDataTableInfo } from '../../../../../types/responses/admin/admin.types';

interface IEntryRecordFormDataTableFieldProps {
    field: IFieldData;
    value: string;
    onChange: (value: string | boolean) => void;
    disabled?: boolean;
    dataVariables?: Record<string, string>;
    ownedDataTable?: ISectionDataTableInfo | null;
}

export function EntryRecordFormDataTableField({
    field,
    value,
    onChange,
    disabled,
    dataVariables,
    ownedDataTable,
}: IEntryRecordFormDataTableFieldProps) {
    const resolvedOwned = ownedDataTable
        ? `${ownedDataTable.display_name ?? ownedDataTable.name} (#${ownedDataTable.id})`
        : null;

    if (!field.config) {
        return (
            <Stack gap="xs">
                <Text size="sm" c="dimmed">No field configuration found</Text>
            </Stack>
        );
    }

    return (
        <Stack gap="xs">
            <SelectField
                fieldId={field.id}
                config={field.config}
                value={value}
                onChange={onChange}
                placeholder="Leave empty for the owned table"
                disabled={disabled}
                dataVariables={dataVariables}
            />
            <Text size="xs" c="dimmed">
                Leave empty to use the table owned by this form section (created automatically when the form is saved).
            </Text>
            {resolvedOwned && (
                <Text size="xs" c="dimmed">
                    Owned table for this section: {resolvedOwned}
                </Text>
            )}
            {value !== '' && (
                <Text size="xs" c="dimmed">
                    Selected table id: {value}
                </Text>
            )}
        </Stack>
    );
}
