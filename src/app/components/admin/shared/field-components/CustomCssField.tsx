'use client';

import {
    Stack,
    Group,
    Text,
    Button,
    ActionIcon,
    TextInput,
    Paper,
    ScrollArea,
    Pill,
    Loader,
    Input,
    Combobox,
    useCombobox
} from '@mantine/core';
import classes from './CustomCssField.module.css';
import { IconPlus, IconX, IconCheck, IconChevronDown } from '@tabler/icons-react';
import { useState, useCallback } from 'react';
import { useCssClasses } from '../../../../../hooks/useCssClasses';
import { IFieldConfig } from '../../../../../types/requests/admin/fields.types';

interface ICustomCssFieldProps {
    fieldId: number;
    fieldConfig: IFieldConfig;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
}

export function CustomCssField({
    fieldId,
    fieldConfig,
    value,
    onChange,
    disabled = false,
    isLoading = false
}: ICustomCssFieldProps) {
    const { data: cssClasses, isLoading: cssLoading } = useCssClasses();
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [newCssClass, setNewCssClass] = useState('');
    const [search, setSearch] = useState('');
    
    const combobox = useCombobox({
        onDropdownClose: () => {
            combobox.resetSelectedOption();
            combobox.focusTarget();
            setSearch('');
        },
        onDropdownOpen: () => {
            combobox.focusSearchInput();
        },
    });

    // For CSS, prioritize API data over fieldConfig.options
    const predefinedOptions = (cssClasses || fieldConfig.options || []).map(option => ({
        value: option.value,
        label: option.text
    }));
    
    // Create a set of predefined values for quick lookup
    const predefinedValues = new Set(predefinedOptions.map(option => option.value));
    
    const separator = fieldConfig.separator || ' ';
    const currentValues = value ? value.split(separator).filter(Boolean) : [];

    // Validation function for creatable CSS classes
    const validateCssClass = (input: string): boolean => {
        // Only allow letters, numbers, hyphens, and underscores
        return /^[a-zA-Z0-9:_-]+$/.test(input);
    };

    // Helper function to determine if a value is predefined
    const isPredefinedValue = (optionValue: string): boolean => {
        return predefinedValues.has(optionValue);
    };

    // Handle creating new CSS class
    const handleCreateCssClass = useCallback(() => {
        if (validateCssClass(newCssClass) && !currentValues.includes(newCssClass)) {
            const updatedValues = [...currentValues, newCssClass];
            onChange(updatedValues.join(separator));
            setNewCssClass('');
            setShowCreateInput(false);
        }
    }, [newCssClass, currentValues, onChange, separator]);

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
    if (!fieldConfig.multiSelect) {
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
                            disabled={disabled || isLoading || cssLoading}
                            style={{
                                minHeight: '36px',
                                cursor: 'pointer'
                            }}
                            styles={{
                                input: {
                                    minHeight: '36px',
                                    height: 'auto',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }
                            }}
                        >
                            {selectedOption ? (
                                <Pill
                                    size="sm"
                                    className={`${classes.pill} ${isPredefinedValue(value) ? classes.predefinedPill : classes.customPill}`}
                                >
                                    {value}
                                </Pill>
                            ) : (
                                <div className={classes.placeholder}>
                                    Search and select CSS class...
                                </div>
                            )}
                        </Input>
                    </Combobox.Target>

                    <Combobox.Dropdown>
                        <Combobox.Search
                            value={search}
                            onChange={(event) => setSearch(event.currentTarget.value)}
                            placeholder="Search CSS classes..."
                        />
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
                                    <Combobox.Empty>No CSS classes found</Combobox.Empty>
                                )}
                            </ScrollArea.Autosize>
                        </Combobox.Options>
                    </Combobox.Dropdown>
                </Combobox>

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
                                    onClick={() => {
                                        if (validateCssClass(newCssClass)) {
                                            onChange(newCssClass);
                                            setNewCssClass('');
                                            setShowCreateInput(false);
                                        }
                                    }}
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
                            cssLoading ? (
                                <Loader size={18} />
                            ) : (
                                <IconChevronDown size={18} />
                            )
                        }
                        onClick={() => combobox.toggleDropdown()}
                        rightSectionPointerEvents="none"
                        disabled={disabled || isLoading || cssLoading}
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
                                Search and select CSS classes...
                            </div>
                        )}
                    </Input>
                </Combobox.Target>

                <Combobox.Dropdown>
                    <Combobox.Search
                        value={search}
                        onChange={(event) => setSearch(event.currentTarget.value)}
                        placeholder="Search CSS classes..."
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
                                <Combobox.Empty>No CSS classes found</Combobox.Empty>
                            )}
                        </ScrollArea.Autosize>
                    </Combobox.Options>
                </Combobox.Dropdown>
            </Combobox>

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
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        handleCreateCssClass();
                                    }
                                }}
                            />
                            <ActionIcon
                                variant="light"
                                color="green"
                                size="sm"
                                onClick={handleCreateCssClass}
                                disabled={!newCssClass || !validateCssClass(newCssClass) || currentValues.includes(newCssClass)}
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