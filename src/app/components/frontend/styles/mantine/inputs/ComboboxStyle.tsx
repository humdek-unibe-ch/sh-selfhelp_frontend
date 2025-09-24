import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    Combobox,
    Input,
    useCombobox,
    Pill,
    Group,
    Text,
    Button,
    ActionIcon,
    TextInput,
    Textarea,
    Stack,
    ScrollArea
} from '@mantine/core';
import { IconPlus, IconX, IconCheck, IconChevronDown } from '@tabler/icons-react';
import { IComboboxStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import parse from "html-react-parser";
import { sanitizeHtmlForInline, sanitizeHtmlForParsing } from '../../../../../../utils/html-sanitizer.utils';

/**
 * Props interface for ComboboxStyle component
 */
/**
 * Props interface for IComboboxStyle component
 */
interface IComboboxStyleProps {
    style: IComboboxStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * ComboboxStyle component renders a configurable Mantine Combobox component.
 * Supports single/multi-select, searchable, and creatable functionality similar to CreatableSelectField.
 *
 * Form Integration Features:
 * - Configurable field name for form submission
 * - Controlled component with state management
 * - Support for required field validation
 * - Optional label and description
 * - Backward compatibility with legacy fields
 * - Hidden input to ensure form submission captures the value
 *
 * @component
 * @param {IComboboxStyleProps} props - Component props
 * @returns {JSX.Element} Rendered configurable Combobox with styled configuration
 */
const ComboboxStyle: React.FC<IComboboxStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const use_mantine_style = style.use_mantine_style?.content === '1';
    const placeholder = style.placeholder?.content || 'Select option...';
    const disabled = style.disabled?.content === '1';

    // Form configuration fields
    const label = style.label?.content;
    const description = style.description?.content || '';
    const name = style.name?.content || `section-${style.id}`;
    const defaultValue = style.value?.content || '';
    const isRequired = style.is_required?.content === '1';

    // Combobox configuration fields
    const multiSelect = style.mantine_combobox_multi_select?.content === '1';
    const searchable = style.mantine_combobox_searchable?.content !== '0'; // Default to true
    const creatable = style.mantine_combobox_creatable?.content === '1';
    const clearable = style.mantine_combobox_clearable?.content === '1';
    const separator = style.mantine_combobox_separator?.content || ' ';
    const maxValues = style.mantine_multi_select_max_values?.content ? parseInt((style as any).mantine_multi_select_max_values?.content!) : undefined;

    // Handle CSS field - use direct property from API response
    

    // Parse combobox options from JSON textarea
    let predefinedOptions: Array<{ value: string; label: string }> = [];
    try {
        const dataJson = style.mantine_combobox_options?.content;

        if (dataJson && dataJson.trim()) {
            const parsed = JSON.parse(dataJson);
            // Handle both formats: {value, label} and {value, text}
            predefinedOptions = parsed.map((option: any) => ({
                value: option.value,
                label: option.label || option.text || option.value
            }));
        } else {
            // Default data if none provided
            predefinedOptions = [
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' }
            ];
        }
    } catch (error) {
        console.warn('Invalid JSON in mantine_combobox_options:', error);
        // Fallback to default options
        predefinedOptions = [
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' }
        ];
    }

    // Create a set of predefined values for quick lookup
    const predefinedValues = new Set(predefinedOptions.map(option => option.value));

    // Helper function to determine if a value is predefined
    const isPredefinedValue = (optionValue: string): boolean => {
        return predefinedValues.has(optionValue);
    };

    if (!use_mantine_style) {
        return null;
    }

    // State management
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [showMultiInput, setShowMultiInput] = useState(false);
    const [newValue, setNewValue] = useState('');
    const [multiValues, setMultiValues] = useState('');
    const [search, setSearch] = useState('');

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Initialize selected values state from form context or style configuration
    const [selectedValues, setSelectedValues] = useState<string[]>(() => {
        if (formValue !== null) {
            // Use form value if available
            if (multiSelect && typeof formValue === 'string') {
                return formValue.split(separator).filter(Boolean);
            } else if (!multiSelect && typeof formValue === 'string') {
                return [formValue];
            }
        }

        // Fallback to style configuration
        if (multiSelect && defaultValue) {
            return defaultValue.split(separator).filter(Boolean);
        } else if (!multiSelect && defaultValue) {
            return [defaultValue];
        }

        return [];
    });

    // Update selected values when form context changes (for record editing)
    useEffect(() => {
        if (formValue !== null) {
            if (multiSelect && typeof formValue === 'string') {
                setSelectedValues(formValue.split(separator).filter(Boolean));
            } else if (!multiSelect && typeof formValue === 'string') {
                setSelectedValues([formValue]);
            }
        }
    }, [formValue, multiSelect, separator]);

    // Initialize combobox hook
    const combobox = useCombobox({
        onDropdownClose: () => {
            combobox.resetSelectedOption();
            combobox.focusTarget();
            if (searchable) {
                setSearch('');
            }
        },
        onDropdownOpen: () => {
            // Only try to focus search input if searchable is enabled
            if (searchable) {
                try {
                    combobox.focusSearchInput();
                } catch (error) {
                    // Silently ignore focus errors when search input is not available
                }
            }
        },
    });

    // Override the focusSearchInput method to prevent errors when search is disabled
    if (!searchable) {
        combobox.focusSearchInput = () => {
            // Do nothing when searchable is false to prevent errors
        };
    }

    // Current values for multi-select
    const currentValues = selectedValues;

    // Handle creating single value
    const handleCreateValue = useCallback(() => {
        if (newValue.trim()) {
            if (multiSelect) {
                // In multi-select mode, add to existing values if not already present and under maxValues limit
                if (!currentValues.includes(newValue) && (!maxValues || currentValues.length < maxValues)) {
                    const updatedValues = [...currentValues, newValue];
                    setSelectedValues(updatedValues);
                }
            } else {
                // In single-select mode, replace the current selection
                setSelectedValues([newValue]);
            }
            setNewValue('');
            setShowCreateInput(false);
        }
    }, [newValue, currentValues, multiSelect, maxValues]);

    // Handle creating multiple values
    const handleCreateMultipleValues = useCallback(() => {
        if (multiValues.trim()) {
            // Split input by whitespace and newlines, filter empty strings
            const newVals = multiValues.split(/[\s\n]+/).filter(Boolean);
            // Filter out values that are already in current values
            const uniqueNewVals = newVals.filter(val => !currentValues.includes(val));

            // Respect maxValues limit for multi-select
            let valuesToAdd = uniqueNewVals;
            if (maxValues) {
                const availableSlots = maxValues - currentValues.length;
                if (availableSlots > 0) {
                    valuesToAdd = uniqueNewVals.slice(0, availableSlots);
                } else {
                    valuesToAdd = [];
                }
            }

            const updatedValues = [...currentValues, ...valuesToAdd];
            setSelectedValues(updatedValues);
            setMultiValues('');
            setShowMultiInput(false);
        }
    }, [multiValues, currentValues, maxValues]);

    // Handle adding/removing values
    const handleToggleValue = useCallback((toggleValue: string) => {
        if (multiSelect) {
            const newValues = currentValues.includes(toggleValue)
                ? currentValues.filter(v => v !== toggleValue)
                : maxValues && currentValues.length >= maxValues
                    ? currentValues // Don't add if maxValues limit is reached
                    : [...currentValues, toggleValue];
            setSelectedValues(newValues);
        } else {
            setSelectedValues([toggleValue]);
            combobox.closeDropdown();
        }
    }, [currentValues, multiSelect, maxValues]);

    // Handle removing a pill
    const handleRemovePill = useCallback((valueToRemove: string) => {
        const newValues = currentValues.filter(v => v !== valueToRemove);
        setSelectedValues(newValues);
    }, [currentValues]);

    // Create combined options including custom values
    const allOptions = [
        ...predefinedOptions,
        // Add any custom values that aren't in predefined options
        ...currentValues
            .filter(val => !isPredefinedValue(val))
            .map(val => ({ value: val, label: val }))
    ];

    // Filter options based on search (only if searchable is enabled)
    const filteredOptions = searchable
        ? allOptions.filter(option =>
            option.label.toLowerCase().includes(search.toLowerCase()) ||
            option.value.toLowerCase().includes(search.toLowerCase())
        )
        : allOptions;

    // Shared creatable section
    const creatableSection = creatable ? (
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
                        Add custom value
                    </Button>
                    {multiSelect && (
                        <Button
                            variant="light"
                            size="xs"
                            leftSection={<IconPlus size={14} />}
                            onClick={() => setShowMultiInput(true)}
                            disabled={disabled}
                        >
                            Add multiple values
                        </Button>
                    )}
                </Group>
            ) : showCreateInput ? (
                <Group gap="xs">
                    <TextInput
                        placeholder="Enter custom value"
                        value={newValue}
                        onChange={(event) => setNewValue(event.currentTarget.value)}
                        size="xs"
                        style={{ flex: 1 }}
                        error={newValue && !newValue.trim() ? 'Invalid value' : null}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                handleCreateValue();
                            }
                        }}
                    />
                    <ActionIcon
                        variant="light"
                        color="green"
                        size="sm"
                        onClick={handleCreateValue}
                        disabled={!newValue.trim() || currentValues.includes(newValue)}
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
            ) : showMultiInput && multiSelect ? (
                <Stack gap="xs">
                    <Textarea
                        placeholder="Enter multiple values (one per line or space-separated)"
                        value={multiValues}
                        onChange={(event) => setMultiValues(event.currentTarget.value)}
                        size="xs"
                        minRows={3}
                        maxRows={6}
                        error={multiValues && !multiValues.trim() ? 'Invalid values' : null}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && event.ctrlKey) {
                                handleCreateMultipleValues();
                            }
                        }}
                    />
                    <Group gap="xs">
                        <Button
                            variant="light"
                            size="xs"
                            leftSection={<IconPlus size={14} />}
                            onClick={handleCreateMultipleValues}
                            disabled={!multiValues.trim()}
                        >
                            Add Values
                        </Button>
                        <Button
                            variant="subtle"
                            size="xs"
                            onClick={() => {
                                setShowMultiInput(false);
                                setMultiValues('');
                            }}
                        >
                            Cancel
                        </Button>
                    </Group>
                </Stack>
            ) : null}
        </>
    ) : null;

    // Single select mode
    if (!multiSelect) {
        const selectedValue = currentValues[0] || '';
        const selectedOption = allOptions.find(opt => opt.value === selectedValue);

        const singleSelectComponent = (
            <Stack gap="xs">
                <Combobox
                    store={combobox}                    
                    withinPortal={false}
                    onOptionSubmit={(val) => {
                        handleToggleValue(val);
                    }}
                >
                    <Combobox.Target>
                        <Input
                            component="div"
                            pointer
                            rightSection={<IconChevronDown size={18} />}
                            onClick={() => combobox.toggleDropdown()}
                            rightSectionPointerEvents="none"
                            disabled={disabled}
                            style={{
                                cursor: 'pointer'
                            }}
                            styles={{
                                input: {
                                    height: 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }
                            }}
                        >
                            {selectedOption ? (
                                <Pill
                                    size="sm"
                                    withRemoveButton={clearable}
                                    onRemove={() => clearable && setSelectedValues([])}
                                    className={`${isPredefinedValue(selectedValue) ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
                                >
                                    {selectedValue}
                                </Pill>
                            ) : (
                                <div style={{ color: 'var(--mantine-color-placeholder)' }}>
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
                                placeholder="Search options..."
                            />
                        )}
                        <Combobox.Options>
                            <ScrollArea.Autosize type="scroll" mah={200}>
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((option) => (
                                        <Combobox.Option
                                            value={option.value}
                                            key={option.value}
                                            active={option.value === selectedValue}
                                        >
                                            <Group justify="space-between">
                                                <Text
                                                    className={isPredefinedValue(option.value) ? 'text-gray-900' : 'text-green-700'}
                                                >
                                                    {option.label}
                                                </Text>
                                                {option.value === selectedValue && <IconCheck size={16} />}
                                            </Group>
                                        </Combobox.Option>
                                    ))
                                ) : (
                                    <Combobox.Empty>No options found</Combobox.Empty>
                                )}
                            </ScrollArea.Autosize>
                        </Combobox.Options>
                    </Combobox.Dropdown>
                </Combobox>
            </Stack>
        );

        return (
            <>
                {label || description ? (
                    <Input.Wrapper
                        label={label}
                        description={parse(sanitizeHtmlForParsing(description))}
                        required={isRequired}
                        {...styleProps} className={cssClass}
                    >
                        <Stack gap="xs">
                            {singleSelectComponent}
                            {creatableSection}
                        </Stack>
                    </Input.Wrapper>
                ) : (
                    <Stack gap="xs">
                        {singleSelectComponent}
                        {creatableSection}
                    </Stack>
                )}
                {/* Hidden input to ensure form submission captures the value */}
                <input
                    type="hidden"
                    name={name}
                    value={selectedValue}
                    required={isRequired}
                />
            </>
        );
    }

    // Multi-select mode
    const multiSelectComponent = (
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
                        rightSection={<IconChevronDown size={18} />}
                        onClick={() => combobox.toggleDropdown()}
                        rightSectionPointerEvents="none"
                        disabled={disabled}
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
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px' }}>
                                {currentValues.map((val) => (
                                    <Pill
                                        key={val}
                                        withRemoveButton
                                        onRemove={() => handleRemovePill(val)}
                                        size="sm"
                                        className={`${isPredefinedValue(val) ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
                                    >
                                        {val}
                                    </Pill>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '8px', color: 'var(--mantine-color-placeholder)' }}>
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
                            placeholder="Search options..."
                        />
                    )}
                    <Combobox.Options>
                        <ScrollArea.Autosize type="scroll" mah={280}>
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <Combobox.Option
                                        value={option.value}
                                        key={option.value}
                                        active={currentValues.includes(option.value)}
                                    >
                                        <Group justify="space-between">
                                            <Text
                                                className={isPredefinedValue(option.value) ? 'text-gray-900' : 'text-green-700'}
                                            >
                                                {option.label}
                                            </Text>
                                            {currentValues.includes(option.value) && <IconCheck size={16} />}
                                        </Group>
                                    </Combobox.Option>
                                ))
                            ) : (
                                <Combobox.Empty>No options found</Combobox.Empty>
                            )}
                        </ScrollArea.Autosize>
                    </Combobox.Options>
                </Combobox.Dropdown>
            </Combobox>
        </Stack>
    );

    // Wrap with Input.Wrapper if label/description present
    const wrappedMultiSelect = label || description ? (
        <Input.Wrapper
            label={label}
            description={parse(sanitizeHtmlForInline(description))}
            required={isRequired}
            {...styleProps} className={cssClass}
        >
            <Stack gap="xs">
                {multiSelectComponent}
                {creatableSection}
            </Stack>
        </Input.Wrapper>
    ) : (
        <Stack gap="xs">
            {multiSelectComponent}
            {creatableSection}
        </Stack>
    );

    // Get the final value for form submission
    const finalValue = multiSelect ? currentValues.join(separator) : currentValues[0] || '';

    return (
        <>
            {wrappedMultiSelect}
            {/* Hidden input to ensure form submission captures the value */}
            <input
                type="hidden"
                name={name}
                value={finalValue}
                required={isRequired}
            />
        </>
    );
};

export default ComboboxStyle;
