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
        label: option.text,
        disabled: option.disabled
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
                placeholder={config.placeholder || placeholder}
                description={config.description}
                error={config.error}
                required={config.required}
                withAsterisk={config.withAsterisk}
                disabled={config.disabled ?? disabled}
                searchable={config.searchable !== false}
                clearable={config.clearable !== false}
                limit={config.limit ?? 20}
                maxDropdownHeight={config.maxDropdownHeight ?? 280}
                maxValues={config.maxValues}
                hidePickedOptions={config.hidePickedOptions}
                checkIconPosition={config.checkIconPosition}
                leftSection={config.leftSection}
                rightSection={config.rightSection}
                comboboxProps={{
                    dropdownPadding: 4,
                    shadow: 'md',
                    ...config.comboboxProps
                }}
                nothingFoundMessage={config.nothingFoundMessage || "No options found..."}
                renderOption={renderOption}
                dropdownOpened={config.dropdownOpened}
                onDropdownOpen={config.onDropdownOpen}
                onDropdownClose={config.onDropdownClose}
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
            placeholder={config.placeholder || placeholder}
            description={config.description}
            error={config.error}
            required={config.required}
            withAsterisk={config.withAsterisk}
            disabled={config.disabled ?? disabled}
            searchable={config.searchable !== false}
            clearable={config.clearable !== false}
            allowDeselect={config.allowDeselect}
            limit={config.limit ?? 20}
            maxDropdownHeight={config.maxDropdownHeight ?? 280}
            checkIconPosition={config.checkIconPosition}
            leftSection={config.leftSection}
            rightSection={config.rightSection}
            comboboxProps={{
                dropdownPadding: 4,
                shadow: 'md',
                ...config.comboboxProps
            }}
            nothingFoundMessage={config.nothingFoundMessage || "No options found..."}
            renderOption={renderOption}
            dropdownOpened={config.dropdownOpened}
            onDropdownOpen={config.onDropdownOpen}
            onDropdownClose={config.onDropdownClose}
        />
    );
}