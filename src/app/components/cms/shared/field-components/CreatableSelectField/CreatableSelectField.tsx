'use client';

import {
    Stack,
    Group,
    Text,
    Button,
    ActionIcon,
    ScrollArea,
    Pill,
    Loader,
    Input,
    Combobox,
    useCombobox
} from '@mantine/core';
import { TextInputWithMentions } from '../TextInputWithMentions';
import classes from './CreatableSelectField.module.css';
import { IconPlus, IconX, IconCheck, IconChevronDown } from '@tabler/icons-react';
import React, { useState, useCallback } from 'react';
import { IFieldConfig } from '../../../../../../types/requests/admin/fields.types';

// Shared configuration types for different CreatableSelectField variants
export interface ICreatableSelectConfig {
    searchable?: boolean;
    placeholder?: string;
    searchPlaceholder?: string;
    noOptionsMessage?: string;
    singleCreatePlaceholder?: string;
    multiCreatePlaceholder?: string;
    addSingleButtonText?: string;
    addMultipleButtonText?: string;
    addClassesButtonText?: string;
    cancelButtonText?: string;
    validateSingle?: (input: string) => boolean;
    validateMultiple?: (input: string) => boolean;
    validationErrorMessage?: string;
}

// Predefined configurations for different use cases
export const CREATABLE_SELECT_CONFIGS = {
    default: {
        placeholder: 'Search and select...',
        searchPlaceholder: 'Search options...',
        noOptionsMessage: 'No options found',
        singleCreatePlaceholder: 'Enter custom value',
        multiCreatePlaceholder: 'Enter multiple values (one per line or space-separated)',
        addSingleButtonText: 'Add custom value',
        addMultipleButtonText: 'Add multiple values',
        addClassesButtonText: 'Add Values',
        cancelButtonText: 'Cancel',
        validateSingle: (input: string) => input.trim().length > 0,
        validateMultiple: (input: string) => input.trim().length > 0,
        validationErrorMessage: 'Invalid value',
    } as ICreatableSelectConfig,

    cssClasses: {
        placeholder: 'Search and select CSS classes...',
        searchPlaceholder: 'Search CSS classes...',
        noOptionsMessage: 'No CSS classes found',
        singleCreatePlaceholder: 'Enter CSS class name (can include variables like stef-{{user_id}})',
        multiCreatePlaceholder: 'Enter multiple CSS classes (space-separated): px-4 py-2 rounded-lg {{my_css}} stef-{{user_id}} text-{{theme}}',
        addSingleButtonText: 'Add custom CSS class',
        addMultipleButtonText: 'Add multiple classes',
        addClassesButtonText: 'Add Classes',
        cancelButtonText: 'Cancel',
        validateSingle: (input: string): boolean => {
            // Allow CSS classes with embedded variables
            if (!input.trim()) return false;
            const varRegex = /\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}/g;
            const invalidVars = input.match(/\{\{[^}]*(?:\{|\}[^}]*\{)/g);
            if (invalidVars) return false;
            const withoutVars = input.replace(varRegex, '');
            return /^[a-zA-Z0-9:_-]*$/.test(withoutVars);
        },
        validateMultiple: (input: string): boolean => {
            if (!input.trim()) return false;
            const classes = input.split(/[\s\n]+/).filter(Boolean);
            const validateSingle = CREATABLE_SELECT_CONFIGS.cssClasses.validateSingle!;
            return classes.every(cls => validateSingle(cls));
        },
        validationErrorMessage: 'Invalid CSS class name',
    } as ICreatableSelectConfig,
};

export interface ICreatableSelectFieldProps {
    fieldId: number;
    config: IFieldConfig;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
    clearable?: boolean;

    // Customizable labels and placeholders - can use predefined configs
    searchable?: boolean;
    placeholder?: string;
    searchPlaceholder?: string;
    noOptionsMessage?: string;
    singleCreatePlaceholder?: string;
    multiCreatePlaceholder?: string;
    addSingleButtonText?: string;
    addMultipleButtonText?: string;
    addClassesButtonText?: string;
    cancelButtonText?: string;

    // Validation function
    validateSingle?: (input: string) => boolean;
    validateMultiple?: (input: string) => boolean;
    validationErrorMessage?: string;

    // Variables for mentions in custom input fields
    dataVariables?: Record<string, string>;
}

export function CreatableSelectField({
    fieldId,
    config,
    value,
    onChange,
    disabled = false,
    isLoading = false,
    clearable = false,
    searchable = false,
    placeholder = CREATABLE_SELECT_CONFIGS.default.placeholder,
    searchPlaceholder = CREATABLE_SELECT_CONFIGS.default.searchPlaceholder,
    noOptionsMessage = CREATABLE_SELECT_CONFIGS.default.noOptionsMessage,
    singleCreatePlaceholder = CREATABLE_SELECT_CONFIGS.default.singleCreatePlaceholder,
    multiCreatePlaceholder = CREATABLE_SELECT_CONFIGS.default.multiCreatePlaceholder,
    addSingleButtonText = CREATABLE_SELECT_CONFIGS.default.addSingleButtonText,
    addMultipleButtonText = CREATABLE_SELECT_CONFIGS.default.addMultipleButtonText,
    addClassesButtonText = CREATABLE_SELECT_CONFIGS.default.addClassesButtonText,
    cancelButtonText = CREATABLE_SELECT_CONFIGS.default.cancelButtonText,
    validateSingle = CREATABLE_SELECT_CONFIGS.default.validateSingle!,
    validateMultiple = CREATABLE_SELECT_CONFIGS.default.validateMultiple!,
    validationErrorMessage = CREATABLE_SELECT_CONFIGS.default.validationErrorMessage,
    dataVariables
}: ICreatableSelectFieldProps) {
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [showMultiInput, setShowMultiInput] = useState(false);
    const [newValue, setNewValue] = useState('');
    const [multiValues, setMultiValues] = useState('');
    const [search, setSearch] = useState('');

    const combobox = useCombobox({
        onDropdownClose: () => {
            combobox.resetSelectedOption();
            combobox.focusTarget();
            setSearch('');
        },
        onDropdownOpen: () => {
            // Only try to focus search input if searchable is enabled
            if (config.searchable) {
                try {
                    combobox.focusSearchInput();
                } catch (error) {
                    // Silently ignore focus errors when search input is not available
                    console.warn('Search input not available for focusing');
                }
            }
        },
    });

    const predefinedOptions = (config.options || []).map(option => ({
        value: option.value,
        label: option.text
    }));

    // Create a set of predefined values for quick lookup
    const predefinedValues = new Set(predefinedOptions.map(option => option.value));

    const separator = config.separator || ' ';
    const currentValues = value ? value.split(separator).filter(Boolean) : [];

    // Helper function to determine if a value is predefined
    const isPredefinedValue = (optionValue: string): boolean => {
        return predefinedValues.has(optionValue);
    };

    // Handle creating single value
    const handleCreateValue = useCallback(() => {
        if (validateSingle(newValue) && !currentValues.includes(newValue)) {
            const updatedValues = [...currentValues, newValue];
            onChange(updatedValues.join(separator));
            setNewValue('');
            setShowCreateInput(false);
        }
    }, [newValue, currentValues, onChange, separator, validateSingle]);

    // Handle creating multiple values
    const handleCreateMultipleValues = useCallback(() => {
        if (validateMultiple(multiValues)) {
            // Split input by whitespace and newlines, filter empty strings
            const newVals = multiValues.split(/[\s\n]+/).filter(Boolean);
            // Filter out values that are already in current values
            const uniqueNewVals = newVals.filter(val => !currentValues.includes(val));
            const updatedValues = [...currentValues, ...uniqueNewVals];
            onChange(updatedValues.join(separator));
            setMultiValues('');
            setShowMultiInput(false);
        }
    }, [multiValues, currentValues, onChange, separator, validateMultiple]);

    // Handle adding/removing values
    const handleToggleValue = useCallback((toggleValue: string) => {
        const newValues = currentValues.includes(toggleValue)
            ? currentValues.filter(v => v !== toggleValue)
            : [...currentValues, toggleValue];
        onChange(newValues.join(separator));
    }, [currentValues, onChange, separator]);

    // Handle removing a pill
    const handleRemovePill = useCallback((valueToRemove: string) => {
        const newValues = currentValues.filter(v => v !== valueToRemove);
        onChange(newValues.join(separator));
    }, [currentValues, onChange, separator]);

    // Create combined options including custom values
    const allOptions = [
        ...predefinedOptions,
        // Add any custom values that aren't in predefined options
        ...currentValues
            .filter(val => !isPredefinedValue(val))
            .map(val => ({ value: val, label: val }))
    ];

    // Filter options based on search
    const filteredOptions = allOptions.filter(option =>
        option.label.toLowerCase().includes(search.toLowerCase()) ||
        option.value.toLowerCase().includes(search.toLowerCase())
    );

    // Handle single select
    if (!config.multiSelect) {
        const selectedOption = allOptions.find(opt => opt.value === value);

        return (
            <Stack gap="xs">
                <Combobox
                    store={combobox}
                    withinPortal={false}
                    onOptionSubmit={(val) => {
                        onChange(val);
                        combobox.closeDropdown();
                    }}
                >
                    <Combobox.Target>
                        <Input
                            component="div"
                            pointer
                            rightSection={<IconChevronDown size={18} />}
                            onClick={() => combobox.toggleDropdown()}
                            rightSectionPointerEvents="none"
                            disabled={disabled || isLoading}
                        >
                            {selectedOption ? (
                                <Pill
                                    size="sm"
                                    withRemoveButton={clearable}
                                    onRemove={clearable ? () => onChange('') : undefined}
                                    className={`${classes.pill} ${isPredefinedValue(value) ? classes.predefinedPill : classes.customPill}`}
                                >
                                    {value}
                                </Pill>
                            ) : (
                                <div className={classes.placeholder}>
                                    {placeholder}
                                </div>
                            )}
                        </Input>
                    </Combobox.Target>

                    <Combobox.Dropdown>
                        {searchable && (
                            <Combobox.Search
                                value={search}
                                onChange={(event) => setSearch(event.currentTarget.value)}
                                placeholder={searchPlaceholder}
                            />
                        )}
                        <Combobox.Options>
                            <ScrollArea.Autosize type="scroll" mah={200}>
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((option) => (
                                        <Combobox.Option
                                            value={option.value}
                                            key={option.value}
                                            active={option.value === value}
                                            className={classes.dropdownOption}
                                        >
                                            <Group justify="space-between">
                                                <Text
                                                    className={isPredefinedValue(option.value) ? classes.predefinedOption : classes.customOption}
                                                >
                                                    {option.label}
                                                </Text>
                                                {option.value === value && <IconCheck size={16} />}
                                            </Group>
                                        </Combobox.Option>
                                    ))
                                ) : (
                                    <Combobox.Empty>{noOptionsMessage}</Combobox.Empty>
                                )}
                            </ScrollArea.Autosize>
                        </Combobox.Options>
                    </Combobox.Dropdown>
                </Combobox>

                {config.creatable && (
                    <>
                        {!showCreateInput && !showMultiInput ? (
                            <Group gap="xs">
                                <Button
                                    variant="light"
                                    size="xs"
                                    leftSection={<IconPlus size={14} />}
                                    onClick={() => setShowCreateInput(true)}
                                    disabled={disabled}
                                >
                                    {addSingleButtonText}
                                </Button>
                                {config.multiSelect && (
                                    <Button
                                        variant="light"
                                        size="xs"
                                        leftSection={<IconPlus size={14} />}
                                        onClick={() => setShowMultiInput(true)}
                                        disabled={disabled}
                                    >
                                        {addMultipleButtonText}
                                    </Button>
                                )}
                            </Group>
                        ) : showCreateInput ? (
                            <Group gap="xs">
                                <div style={{ flex: 1 }}>
                                    <TextInputWithMentions
                                        fieldId={fieldId}
                                        value={newValue}
                                        onChange={setNewValue}
                                        placeholder={singleCreatePlaceholder}
                                        disabled={false}
                                        validator={newValue ? (value) => ({ isValid: validateSingle(value), error: validateSingle(value) ? undefined : validationErrorMessage }) : undefined}
                                        dataVariables={dataVariables}
                                    />
                                </div>
                                <ActionIcon
                                    variant="light"
                                    color="green"
                                    size="sm"
                                    onClick={() => {
                                        if (validateSingle(newValue)) {
                                            onChange(newValue);
                                            setNewValue('');
                                            setShowCreateInput(false);
                                        }
                                    }}
                                    disabled={!newValue || !validateSingle(newValue)}
                                >
                                    <IconPlus size={14} />
                                </ActionIcon>
                                <ActionIcon
                                    variant="light"
                                    color="gray"
                                    size="sm"
                                    onClick={() => {
                                        setShowCreateInput(false);
                                        setNewValue('');
                                    }}
                                >
                                    <IconX size={14} />
                                </ActionIcon>
                            </Group>
                        ) : showMultiInput ? (
                            <Group gap="xs">
                                <div style={{ flex: 1 }}>
                                    <TextInputWithMentions
                                        fieldId={fieldId}
                                        value={multiValues}
                                        onChange={setMultiValues}
                                        placeholder={multiCreatePlaceholder}
                                        disabled={false}
                                        validator={multiValues ? (value) => ({ isValid: validateMultiple(value), error: validateMultiple(value) ? undefined : validationErrorMessage }) : undefined}
                                        dataVariables={dataVariables}
                                    />
                                </div>
                                <ActionIcon
                                    variant="light"
                                    color="green"
                                    size="sm"
                                    onClick={handleCreateMultipleValues}
                                    disabled={!multiValues || !validateMultiple(multiValues)}
                                >
                                    <IconPlus size={14} />
                                </ActionIcon>
                                <ActionIcon
                                    variant="light"
                                    color="gray"
                                    size="sm"
                                    onClick={() => {
                                        setShowMultiInput(false);
                                        setMultiValues('');
                                    }}
                                >
                                    <IconX size={14} />
                                </ActionIcon>
                            </Group>
                        ) : null}
                    </>
                )}
            </Stack>
        );
    }

    // Handle multi-select
    return (
        <Stack gap="xs">
            <Combobox
                store={combobox}
                withinPortal={false}
                onOptionSubmit={handleToggleValue}
            >
                <Combobox.Target>
                    <Input
                        component="div"
                        pointer
                        rightSection={
                            isLoading ? (
                                <Loader size={18} />
                            ) : (
                                <IconChevronDown size={18} />
                            )
                        }
                        onClick={() => combobox.toggleDropdown()}
                        rightSectionPointerEvents="none"
                        disabled={disabled || isLoading}
                        style={{
                            minHeight: '36px',
                            cursor: 'pointer'
                        }}
                        styles={{
                            input: {
                                minHeight: '36px',
                                height: 'auto',
                                padding: '0',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                cursor: 'pointer'
                            }
                        }}
                    >
                        {currentValues.length > 0 ? (
                            <div className={classes.pillsContainer}>
                                {currentValues.map((val) => (
                                    <Pill
                                        key={val}
                                        withRemoveButton
                                        onRemove={() => handleRemovePill(val)}
                                        size="sm"
                                        className={`${classes.pill} ${isPredefinedValue(val) ? classes.predefinedPill : classes.customPill}`}
                                    >
                                        {val}
                                    </Pill>
                                ))}
                            </div>
                        ) : (
                            <div className={classes.placeholder}>
                                {placeholder}
                            </div>
                        )}
                    </Input>
                </Combobox.Target>

                <Combobox.Dropdown>
                    <Combobox.Search
                        value={search}
                        onChange={(event) => setSearch(event.currentTarget.value)}
                        placeholder={searchPlaceholder}
                    />
                    <Combobox.Options>
                        <ScrollArea.Autosize type="scroll" mah={280}>
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <Combobox.Option
                                        value={option.value}
                                        key={option.value}
                                        active={currentValues.includes(option.value)}
                                        className={classes.dropdownOption}
                                    >
                                        <Group justify="space-between">
                                            <Text
                                                className={isPredefinedValue(option.value) ? classes.predefinedOption : classes.customOption}
                                            >
                                                {option.label}
                                            </Text>
                                            {currentValues.includes(option.value) && <IconCheck size={16} />}
                                        </Group>
                                    </Combobox.Option>
                                ))
                            ) : (
                                <Combobox.Empty>{noOptionsMessage}</Combobox.Empty>
                            )}
                        </ScrollArea.Autosize>
                    </Combobox.Options>
                </Combobox.Dropdown>
            </Combobox>

            {config.creatable && (
                <>
                    {!showCreateInput && !showMultiInput ? (
                        <Group gap="xs">
                            <Button
                                variant="light"
                                size="xs"
                                leftSection={<IconPlus size={14} />}
                                onClick={() => setShowCreateInput(true)}
                                disabled={disabled}
                            >
                                {addSingleButtonText}
                            </Button>
                            <Button
                                variant="light"
                                size="xs"
                                leftSection={<IconPlus size={14} />}
                                onClick={() => setShowMultiInput(true)}
                                disabled={disabled}
                            >
                                {addMultipleButtonText}
                            </Button>
                        </Group>
                    ) : showCreateInput ? (
                        <Group gap="xs">
                            <div style={{ flex: 1 }}>
                                <TextInputWithMentions
                                    fieldId={fieldId}
                                    value={newValue}
                                    onChange={setNewValue}
                                    placeholder={singleCreatePlaceholder}
                                    disabled={false}
                                    validator={newValue ? (value) => ({ isValid: validateSingle(value), error: validateSingle(value) ? undefined : validationErrorMessage }) : undefined}
                                    dataVariables={dataVariables}
                                />
                            </div>
                            <ActionIcon
                                variant="light"
                                color="green"
                                size="sm"
                                onClick={handleCreateValue}
                                disabled={!newValue || !validateSingle(newValue) || currentValues.includes(newValue)}
                            >
                                <IconPlus size={14} />
                            </ActionIcon>
                            <ActionIcon
                                variant="light"
                                color="gray"
                                size="sm"
                                onClick={() => {
                                    setShowCreateInput(false);
                                    setNewValue('');
                                }}
                            >
                                <IconX size={14} />
                            </ActionIcon>
                        </Group>
                    ) : showMultiInput ? (
                        <Group gap="xs">
                            <div style={{ flex: 1 }}>
                                <TextInputWithMentions
                                    fieldId={fieldId}
                                    value={multiValues}
                                    onChange={setMultiValues}
                                    placeholder={multiCreatePlaceholder}
                                    disabled={false}
                                    validator={multiValues ? (value) => ({ isValid: validateMultiple(value), error: validateMultiple(value) ? undefined : validationErrorMessage }) : undefined}
                                    dataVariables={dataVariables}
                                />
                            </div>
                            <ActionIcon
                                variant="light"
                                color="green"
                                size="sm"
                                onClick={handleCreateMultipleValues}
                                disabled={!multiValues || !validateMultiple(multiValues)}
                            >
                                <IconPlus size={14} />
                            </ActionIcon>
                            <ActionIcon
                                variant="light"
                                color="gray"
                                size="sm"
                                onClick={() => {
                                    setShowMultiInput(false);
                                    setMultiValues('');
                                }}
                            >
                                <IconX size={14} />
                            </ActionIcon>
                        </Group>
                    ) : null}
                </>
            )}
        </Stack>
    );
}
