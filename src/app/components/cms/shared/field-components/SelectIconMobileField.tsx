/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React, { useMemo } from 'react';
import { Select, Group, Text, Box, type ComboboxItem, type ComboboxLikeRenderOptionInput } from '@mantine/core';
import * as LucideIcons from 'lucide-react';
import { MOBILE_ICON_SET } from '@selfhelp/shared';
import type { IFieldConfig } from '../../../../../types/requests/admin/fields.types';

/**
 * Mobile menu-icon picker. The option list is the curated lucide set from
 * `@selfhelp/shared` (`MOBILE_ICON_SET`) — the SAME contract the mobile renderer
 * draws with `lucide-react-native`, so the picker preview and the device output
 * never drift. The stored value is the lucide PascalCase name (e.g. `Home`).
 */

type LucideComponent = React.ComponentType<{ size?: number | string }>;

const iconMap = LucideIcons as unknown as Record<string, LucideComponent | undefined>;

interface ISelectIconMobileFieldProps {
    fieldId: number;
    config: IFieldConfig;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    iconSize?: number;
}

export function SelectIconMobileField({
    fieldId,
    config,
    value,
    onChange,
    placeholder = 'Search and select icon...',
    disabled = false,
    iconSize = 16,
}: ISelectIconMobileFieldProps) {
    const options = useMemo(
        () =>
            MOBILE_ICON_SET.map((entry) => ({
                value: entry.name,
                label: entry.label,
                iconName: entry.name,
            })),
        []
    );

    const renderOption = ({ option }: ComboboxLikeRenderOptionInput<ComboboxItem>) => {
        const iconName = (option as ComboboxItem & { iconName?: string }).iconName;
        const IconComponent = iconName ? iconMap[iconName] : undefined;
        return (
            <Group gap="sm" wrap="nowrap" w="100%">
                {IconComponent && (
                    <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
                        <IconComponent size={iconSize} />
                    </Box>
                )}
                <Text size="sm" truncate="end">
                    {option.label}
                </Text>
            </Group>
        );
    };

    const SelectedIcon = value ? iconMap[value] : undefined;

    return (
        <Select
            key={fieldId}
            data={options}
            value={value || ''}
            onChange={(v) => onChange(v || '')}
            placeholder={config.placeholder || placeholder}
            description={config.description}
            error={config.error}
            required={config.required}
            withAsterisk={config.withAsterisk}
            disabled={config.disabled ?? disabled}
            searchable
            clearable
            allowDeselect
            maxDropdownHeight={config.maxDropdownHeight ?? 300}
            checkIconPosition="right"
            comboboxProps={{ dropdownPadding: 4, shadow: 'md', ...config.comboboxProps }}
            nothingFoundMessage="No icons found..."
            renderOption={renderOption}
            leftSection={SelectedIcon ? <SelectedIcon size={iconSize} /> : undefined}
            leftSectionPointerEvents="none"
        />
    );
}
