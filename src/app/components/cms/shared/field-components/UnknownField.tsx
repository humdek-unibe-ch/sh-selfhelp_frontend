/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Box, Group, Text, TextInput } from '@mantine/core';

interface IUnknownFieldProps {
    fieldId: number;
    fieldType: string | null;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function UnknownField({
    fieldId,
    fieldType,
    value,
    onChange,
    placeholder
}: IUnknownFieldProps) {
    return (
        <Box>
            <Group gap="xs" mt="xs">
                <Text size="sm" c="dimmed">Unknown field type: {fieldType || 'null'}</Text>
            </Group>
            <TextInput
                key={fieldId}
                placeholder={placeholder || ''}
                value={value}
                onChange={(event) => onChange(event.currentTarget.value)}
                disabled
            />
        </Box>
    );
}