'use client';

import { Select, MultiSelect, Group, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import type { IFieldConfig } from '../../../../../types/requests/admin/fields.types';

interface ISelectFieldProps {
    fieldId: number;
    config: IFieldConfig;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function SelectField({
    fieldId,
    config: config,
    value,
    onChange,
    placeholder = 'Search and select...',
    disabled = false
}: ISelectFieldProps) {
    const options = (config.options || []).map(option => ({
        value: option.value,
        label: option.text
    }));
    const separator = config.separator || ',';

    // Custom render option function with selection indicator
    const renderOption = ({ option, ...others }: any) => (
        <Group {...others} justify="space-between" wrap="nowrap" w="100%">
            <Text>
                {option.label}
            </Text>
            {(config.multiSelect ? 
                value.split(separator).includes(option.value) : 
                value === option.value
            ) && <IconCheck size={16} color="var(--mantine-color-blue-6)" />}
        </Group>
    );

    // Handle multi-select
    if (config.multiSelect) {
        const currentValues = value ? value.split(separator).filter(Boolean) : [];
        
        return (
            <MultiSelect
                key={fieldId}
                data={options}
                value={currentValues}
                onChange={(values) => onChange(values.join(separator))}
                placeholder={placeholder}
                disabled={disabled}
                searchable
                clearable
                limit={20}
                maxDropdownHeight={280}
                comboboxProps={{
                    dropdownPadding: 4,
                    shadow: 'md'
                }}
                nothingFoundMessage="No options found..."
                renderOption={renderOption}
            />
        );
    }

    // Handle single select
    return (
        <Select
            key={fieldId}
            data={options}
            value={value || ''}
            onChange={(selectedValue) => onChange(selectedValue || '')}
            placeholder={placeholder}
            disabled={disabled}
            searchable
            clearable
            limit={20}
            maxDropdownHeight={280}
            comboboxProps={{
                dropdownPadding: 4,
                shadow: 'md'
            }}
            nothingFoundMessage="No options found..."
            renderOption={renderOption}
        />
    );
}