'use client';

import {
    MultiSelect,
    Select,
    Stack,
    Group,
    Text,
    Button,
    ActionIcon,
    TextInput
} from '@mantine/core';
import { IconPlus, IconX, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { useCssClasses } from '../../../../../hooks/useCssClasses';
import { IFieldConfig } from '../../../../../types/requests/admin/fields.types';

interface ISelectCssFieldProps {
    fieldId: number;
    fieldConfig: IFieldConfig;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
}

export function SelectCssField({
    fieldId,
    fieldConfig,
    value,
    onChange,
    disabled = false,
    isLoading = false
}: ISelectCssFieldProps) {
    const { data: cssClasses, isLoading: cssLoading } = useCssClasses();
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [newCssClass, setNewCssClass] = useState('');

    // For CSS, prioritize API data over fieldConfig.options
    const predefinedOptions = (cssClasses || fieldConfig.options || []).map(option => ({
        value: option.value,
        label: option.text
    }));
    
    // Create a set of predefined values for quick lookup
    const predefinedValues = new Set(predefinedOptions.map(option => option.value));
    
    const separator = fieldConfig.separator || ' ';

    // Validation function for creatable CSS classes
    const validateCssClass = (input: string): boolean => {
        // Only allow letters, numbers, hyphens, and underscores
        return /^[a-zA-Z0-9_-]+$/.test(input);
    };

    // Handle creating new CSS class
    const handleCreateCssClass = () => {
        if (validateCssClass(newCssClass)) {
            if (fieldConfig.multiSelect) {
                const currentValues = value ? value.split(separator).filter(Boolean) : [];
                const updatedValues = [...currentValues, newCssClass];
                onChange(updatedValues.join(separator));
            } else {
                onChange(newCssClass);
            }
            setNewCssClass('');
            setShowCreateInput(false);
        }
    };

    // Helper function to determine if a value is predefined
    const isPredefinedValue = (optionValue: string): boolean => {
        return predefinedValues.has(optionValue);
    };

    // Custom render option function with proper coloring
    const renderOption = ({ option, checked, ...others }: any) => (
        <Group {...others} justify="space-between" wrap="nowrap" w="100%">
            <Text 
                style={{ 
                    color: isPredefinedValue(option.value) ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-blue-6)',
                    fontWeight: isPredefinedValue(option.value) ? 400 : 700
                }}
            >
                {option.label}
            </Text>
            {checked && <IconCheck size={16} color="var(--mantine-color-blue-6)" />}
        </Group>
    );

    // Handle multi-select
    if (fieldConfig.multiSelect) {
        const currentValues = value ? value.split(separator).filter(Boolean) : [];
        
        // Create combined options including custom values
        const allOptionsWithCustom = [
            ...predefinedOptions,
            // Add any custom values that aren't in predefined options
            ...currentValues
                .filter(val => !isPredefinedValue(val))
                .map(val => ({ value: val, label: val }))
        ];
        
        return (
            <Stack gap="xs">
                <MultiSelect
                    key={fieldId}
                    data={allOptionsWithCustom}
                    value={currentValues}
                    onChange={(values) => onChange(values.join(separator))}
                    placeholder="Search and select CSS classes..."
                    disabled={disabled || isLoading || cssLoading}
                    searchable
                    clearable
                    limit={20}
                    maxDropdownHeight={280}
                    comboboxProps={{
                        dropdownPadding: 4,
                        shadow: 'md'
                    }}
                    nothingFoundMessage="No CSS classes found..."
                    renderOption={renderOption}
                />
                {fieldConfig.creatable && (
                    <>
                        {!showCreateInput ? (
                            <Button
                                variant="light"
                                size="xs"
                                leftSection={<IconPlus size={14} />}
                                onClick={() => setShowCreateInput(true)}
                                disabled={disabled}
                            >
                                Add custom CSS class
                            </Button>
                        ) : (
                            <Group gap="xs">
                                <TextInput
                                    placeholder="Enter CSS class name (letters, numbers, hyphens, underscores only)"
                                    value={newCssClass}
                                    onChange={(event) => setNewCssClass(event.currentTarget.value)}
                                    size="xs"
                                    style={{ flex: 1 }}
                                    error={newCssClass && !validateCssClass(newCssClass) ? 'Invalid CSS class name' : null}
                                />
                                <ActionIcon
                                    variant="light"
                                    color="green"
                                    size="sm"
                                    onClick={handleCreateCssClass}
                                    disabled={!newCssClass || !validateCssClass(newCssClass)}
                                >
                                    <IconPlus size={14} />
                                </ActionIcon>
                                <ActionIcon
                                    variant="light"
                                    color="gray"
                                    size="sm"
                                    onClick={() => {
                                        setShowCreateInput(false);
                                        setNewCssClass('');
                                    }}
                                >
                                    <IconX size={14} />
                                </ActionIcon>
                            </Group>
                        )}
                    </>
                )}
            </Stack>
        );
    }

    // Handle single select
    // Create combined options including custom values for single select
    const allSingleOptionsWithCustom = [
        ...predefinedOptions,
        // Add custom value if it exists and isn't in predefined options
        ...(value && !isPredefinedValue(value) ? [{ value, label: value }] : [])
    ];
    
    return (
        <Stack gap="xs">
            <Select
                key={fieldId}
                data={allSingleOptionsWithCustom}
                value={value || ''}
                onChange={(selectedValue) => onChange(selectedValue || '')}
                placeholder="Search and select CSS class..."
                disabled={disabled || isLoading || cssLoading}
                searchable
                clearable
                limit={20}
                maxDropdownHeight={280}
                comboboxProps={{
                    dropdownPadding: 4,
                    shadow: 'md'
                }}
                nothingFoundMessage="No CSS classes found..."
                renderOption={renderOption}
            />
            {fieldConfig.creatable && (
                <>
                    {!showCreateInput ? (
                        <Button
                            variant="light"
                            size="xs"
                            leftSection={<IconPlus size={14} />}
                            onClick={() => setShowCreateInput(true)}
                            disabled={disabled}
                        >
                            Add custom CSS class
                        </Button>
                    ) : (
                        <Group gap="xs">
                            <TextInput
                                placeholder="Enter CSS class name (letters, numbers, hyphens, underscores only)"
                                value={newCssClass}
                                onChange={(event) => setNewCssClass(event.currentTarget.value)}
                                size="xs"
                                style={{ flex: 1 }}
                                error={newCssClass && !validateCssClass(newCssClass) ? 'Invalid CSS class name' : null}
                            />
                            <ActionIcon
                                variant="light"
                                color="green"
                                size="sm"
                                onClick={handleCreateCssClass}
                                disabled={!newCssClass || !validateCssClass(newCssClass)}
                            >
                                <IconPlus size={14} />
                            </ActionIcon>
                            <ActionIcon
                                variant="light"
                                color="gray"
                                size="sm"
                                onClick={() => {
                                    setShowCreateInput(false);
                                    setNewCssClass('');
                                }}
                            >
                                <IconX size={14} />
                            </ActionIcon>
                        </Group>
                    )}
                </>
            )}
        </Stack>
    );
}