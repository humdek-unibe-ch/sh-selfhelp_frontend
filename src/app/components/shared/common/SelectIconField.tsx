'use client';

import React, { useMemo, useState } from 'react';
import { Select, Group, Text, Box } from '@mantine/core';
import * as TablerIcons from '@tabler/icons-react';
import type { IFieldConfig } from '../../../../types/requests/admin/fields.types';

interface ISelectIconFieldProps {
    fieldId: number;
    config: IFieldConfig;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    iconSize?: number;
}

export function SelectIconField({
    fieldId,
    config,
    value,
    onChange,
    placeholder = 'Search and select icon...',
    disabled = false,
    iconSize = 16
}: ISelectIconFieldProps) {
    const [searchValue, setSearchValue] = useState('');

    // All icon component names (e.g., IconHome, IconUser, ...)
    const allIconNames = useMemo(() => {
        const names = Object.keys(TablerIcons).filter(
            (name) => name.startsWith('Icon')
        );
        return names;
    }, []);

    // Filter: first 50 when no search; otherwise search across ALL icons
    // Always include the current selected value in the first 50 if it exists
    const filteredIconNames = useMemo(() => {
        if (!searchValue.trim()) {
            const first50 = allIconNames.slice(0, 50);
            if (value && !first50.includes(value)) {
                // Add the selected value to the beginning of the list
                return [value, ...first50.slice(0, 49)];
            }
            return first50;
        }

        const search = searchValue.toLowerCase();

        // Search by full component name and by label without the "Icon" prefix.
        // Also add a kebab-case variant to make searches like "arrow-left" work.
        const toKebab = (s: string) =>
            s
                .replace(/^Icon/, '')
                .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
                .toLowerCase();

        return allIconNames.filter((name) => {
            const noPrefix = name.replace(/^Icon/, '');
            const labelLc = noPrefix.toLowerCase();
            const kebab = toKebab(name);
            return (
                name.toLowerCase().includes(search) ||
                labelLc.includes(search) ||
                kebab.includes(search)
            );
        });
    }, [allIconNames, searchValue, value]);

    // Build Select options (we pass through iconName so renderOption can use it)
    const options = useMemo(
        () =>
            filteredIconNames.map((iconName) => ({
                value: iconName,
                label: iconName.replace(/^Icon/, ''),
                iconName
            })),
        [filteredIconNames]
    );

    // Custom option renderer with icon preview
    const renderOption = ({ option, ...others }: any) => {
        const IconComponent = TablerIcons[option.iconName as keyof typeof TablerIcons] as React.ElementType;
        return (
            <Group {...others} justify="space-between" wrap="nowrap" w="100%" gap="sm">
                <Group gap="sm" wrap="nowrap">
                    {IconComponent && (
                        <Box
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 20,
                                height: 20
                            }}
                        >
                            <IconComponent size={iconSize} />
                        </Box>
                    )}
                    <Text size="sm" truncate="end">
                        {option.label}
                    </Text>
                </Group>
            </Group>
        );
    };

    // Selected icon preview in the input
    const SelectedIcon = value ? (TablerIcons[value as keyof typeof TablerIcons] as React.ElementType) : undefined;

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
            limit={config.limit ?? 50}
            maxDropdownHeight={config.maxDropdownHeight ?? 300}
            checkIconPosition="right"
            comboboxProps={{
                dropdownPadding: 4,
                shadow: 'md',
                ...config.comboboxProps
            }}
            nothingFoundMessage={
                searchValue
                    ? 'No icons found...'
                    : 'Showing first 50 icons. Start typing to search all...'
            }
            renderOption={renderOption}
            onSearchChange={setSearchValue}
            searchValue={searchValue}
            dropdownOpened={config.dropdownOpened}
            onDropdownOpen={config.onDropdownOpen}
            onDropdownClose={config.onDropdownClose}
            // Show the selected icon in the input (optional)
            leftSection={
                SelectedIcon ? (
                    <SelectedIcon size={iconSize} />
                ) : undefined
            }
            leftSectionPointerEvents="none"
        />
    );
}
