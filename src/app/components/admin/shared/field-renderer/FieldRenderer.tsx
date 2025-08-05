'use client';

import {
    TextInput,
    Textarea,
    Checkbox,
    Box,
    Group,
    Text,
    Code,
    Badge,
    Stack,
    Select,
    MultiSelect,
    Button,
    ActionIcon
} from '@mantine/core';
import { IconPlus, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { FieldLabelWithTooltip } from '../../../ui/field-label-with-tooltip/FieldLabelWithTooltip';
import { MonacoFieldEditor, TMonacoLanguage } from '../monaco-field-editor/MonacoFieldEditor';
import { useMantineColorScheme } from '@mantine/core';
import { useCssClasses } from '../../../../../hooks/useCssClasses';
import type { IFieldConfig } from '../../../../../types/requests/admin/fields.types';

export interface IFieldData {
    id: number;
    name: string;
    title: string | null;
    type: string | null;
    default_value: string | null;
    help: string | null;
    disabled?: boolean;
    hidden?: number;
    display?: boolean;
    fieldConfig?: IFieldConfig;
}

interface IFieldRendererProps {
    field: IFieldData;
    value: string | boolean;
    onChange: (value: string | boolean) => void;
    locale?: string;
    className?: string;
    disabled?: boolean;
}

export function FieldRenderer({
    field,
    value,
    onChange,
    locale,
    className,
    disabled = false
}: IFieldRendererProps) {
    const { colorScheme } = useMantineColorScheme();
    const fieldValue = typeof value === 'string' ? value : String(value);
    
    // Helper function to get field label (use title when available, fallback to name)
    const getFieldLabel = () => {
        return field.title && field.title.trim() ? field.title : field.name;
    };    
    
    // Helper function to get field type badge color
    const getFieldTypeBadgeColor = (type: string | null) => {
        switch (type) {
            case 'css': return 'blue';
            case 'json': return 'orange';
            case 'markdown': return 'green';
            case 'markdown-inline': return 'teal';
            case 'text': return 'gray';
            case 'textarea': return 'indigo';
            case 'checkbox': return 'pink';
            case 'select-css': return 'violet';
            case 'select-group': return 'cyan';
            case 'select-data_table': return 'grape';
            case 'select-page-keyword': return 'lime';
            default: return 'red';
        }
    };

    // Helper function to render field with type badge
    const renderFieldWithBadge = (children: React.ReactNode) => {
        return (
            <Stack gap="xs" className={className}>
                <Group gap="xs" align="center">
                    <FieldLabelWithTooltip label={getFieldLabel()} tooltip={field.help || ''} locale={locale} />
                    <Badge size="xs" variant="light" color={getFieldTypeBadgeColor(field.type)}>
                        {field.type || 'unknown'}
                    </Badge>
                </Group>
                {children}
            </Stack>
        );
    };
    
    // Handle checkbox separately as it has inline label
    if (field.type === 'checkbox') {
        return (
            <Stack gap="xs" className={className}>
                <Group gap="xs" align="center">
                    <Checkbox
                        key={field.id}
                        label={<FieldLabelWithTooltip label={getFieldLabel()} tooltip={field.help || ''} locale={locale} />}
                        checked={!!value}
                        onChange={(event) => onChange(event.currentTarget.checked)}
                        disabled={disabled}
                    />
                    <Badge size="xs" variant="light" color="pink">
                        checkbox
                    </Badge>
                </Group>
            </Stack>
        );
    }
    
    // CSS field - use Monaco Editor
    if (field.type === 'css') {
        return renderFieldWithBadge(
            <MonacoFieldEditor
                key={field.id}
                value={fieldValue}
                onChange={(value) => {
                    // Ensure the change is propagated immediately
                    onChange(value);
                }}
                language="css"
                height={250}
                readOnly={disabled}
                theme={colorScheme === 'dark' ? 'vs-dark' : 'vs'}
            />
        );
    }
    
    // JSON field - use Monaco Editor
    if (field.type === 'json') {
        return renderFieldWithBadge(
            <MonacoFieldEditor
                key={field.id}
                value={fieldValue}
                onChange={(value) => {
                    // Ensure the change is propagated immediately
                    onChange(value);
                }}
                language="json"
                height={250}
                readOnly={disabled}
                theme={colorScheme === 'dark' ? 'vs-dark' : 'vs'}
            />
        );
    }
    
    // Markdown field - use Monaco Editor
    if (field.type === 'markdown') {
        return renderFieldWithBadge(
            <MonacoFieldEditor
                key={field.id}
                value={fieldValue}
                onChange={(value) => {
                    // Ensure the change is propagated immediately
                    onChange(value);
                }}
                language="markdown"
                height={300}
                readOnly={disabled}
                theme={colorScheme === 'dark' ? 'vs-dark' : 'vs'}
            />
        );
    }
    
    // Textarea field
    if (field.type === 'textarea') {
        return renderFieldWithBadge(
            <Textarea
                key={field.id}
                placeholder={field.default_value || ''}
                value={fieldValue}
                onChange={(event) => onChange(event.currentTarget.value)}
                disabled={disabled}
                autosize
                minRows={3}
                maxRows={8}
            />
        );
    }
    
    // Text and markdown-inline fields
    if (field.type === 'text' || field.type === 'markdown-inline') {
        return renderFieldWithBadge(
            <TextInput
                key={field.id}
                placeholder={field.default_value || ''}
                value={fieldValue}
                onChange={(event) => onChange(event.currentTarget.value)}
                disabled={disabled}
            />
        );
    }

    // Select CSS field - dynamic select with API options
    if (field.type === 'select-css') {
        const { data: cssClasses, isLoading } = useCssClasses();
        const fieldConfig = field.fieldConfig;
        const [showCreateInput, setShowCreateInput] = useState(false);
        const [newCssClass, setNewCssClass] = useState('');
        
        if (!fieldConfig) {
            return renderFieldWithBadge(
                <Box>
                    <Text size="sm" c="dimmed">No field configuration found</Text>
                    <TextInput
                        placeholder={field.default_value || ''}
                        value={fieldValue}
                        onChange={(event) => onChange(event.currentTarget.value)}
                        disabled
                    />
                </Box>
            );
        }

        // For CSS, prioritize API data over fieldConfig.options
        const allOptions = (cssClasses || fieldConfig.options || []).map(option => ({
            value: option.value,
            label: option.text
        }));
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
                    const currentValues = fieldValue ? fieldValue.split(separator).filter(Boolean) : [];
                    const updatedValues = [...currentValues, newCssClass];
                    onChange(updatedValues.join(separator));
                } else {
                    onChange(newCssClass);
                }
                setNewCssClass('');
                setShowCreateInput(false);
            }
        };

        // Handle multi-select with large dataset optimization
        if (fieldConfig.multiSelect) {
            const currentValues = fieldValue ? fieldValue.split(separator).filter(Boolean) : [];
            
            return renderFieldWithBadge(
                <Stack gap="xs">
                    <MultiSelect
                        key={field.id}
                        data={allOptions}
                        value={currentValues}
                        onChange={(values) => onChange(values.join(separator))}
                        placeholder={'Search and select CSS classes...'}
                        disabled={disabled || isLoading}
                        searchable
                        clearable
                        limit={20}
                        maxDropdownHeight={280}
                        comboboxProps={{
                            dropdownPadding: 4,
                            shadow: 'md'
                        }}
                        nothingFoundMessage="No CSS classes found..."
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

        // Handle single select with large dataset optimization
        return renderFieldWithBadge(
            <Stack gap="xs">
                <Select
                    key={field.id}
                    data={allOptions}
                    value={fieldValue}
                    onChange={(value) => onChange(value || '')}
                    placeholder={'Search and select CSS class...'}
                    disabled={disabled || isLoading}
                    searchable
                    clearable
                    limit={20}
                    maxDropdownHeight={280}
                    comboboxProps={{
                        dropdownPadding: 4,
                        shadow: 'md'
                    }}
                    nothingFoundMessage="No CSS classes found..."
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



    // Select Group field - dynamic select with API options
    if (field.type === 'select-group') {
        const fieldConfig = field.fieldConfig;
        
        if (!fieldConfig) {
            return renderFieldWithBadge(
                <Box>
                    <Text size="sm" c="dimmed">No field configuration found</Text>
                    <TextInput
                        placeholder={field.default_value || ''}
                        value={fieldValue}
                        onChange={(event) => onChange(event.currentTarget.value)}
                        disabled
                    />
                </Box>
            );
        }

        // For groups, use only fieldConfig.options (no API calls needed)
        const options = (fieldConfig.options || []).map(option => ({
            value: option.value,
            label: option.text
        }));
        const separator = fieldConfig.separator || ',';

        // Handle multi-select with optimization
        if (fieldConfig.multiSelect) {
            const currentValues = fieldValue ? fieldValue.split(separator).filter(Boolean) : [];
            
            return renderFieldWithBadge(
                <MultiSelect
                    key={field.id}
                    data={options}
                    value={currentValues}
                    onChange={(values) => onChange(values.join(separator))}
                    disabled={disabled}
                    searchable
                    clearable
                    limit={20}
                    maxDropdownHeight={280}
                    comboboxProps={{
                        dropdownPadding: 4,
                        shadow: 'md'
                    }}
                    nothingFoundMessage="No groups found..."
                />
            );
        }

        // Handle single select with optimization
        return renderFieldWithBadge(
            <Select
                key={field.id}
                data={options}
                value={fieldValue}
                onChange={(value) => onChange(value || '')}
                placeholder={'Search and select group...'}
                disabled={disabled}
                searchable
                clearable
                limit={20}
                maxDropdownHeight={280}
                comboboxProps={{
                    dropdownPadding: 4,
                    shadow: 'md'
                }}
                nothingFoundMessage="No groups found..."
            />
        );
    }   

    // Select Data Table field - dynamic select with API options
    if (field.type === 'select-data_table') {
        const fieldConfig = field.fieldConfig;
        
        if (!fieldConfig) {
            return renderFieldWithBadge(
                <Box>
                    <Text size="sm" c="dimmed">No field configuration found</Text>
                    <TextInput
                        placeholder={field.default_value || ''}
                        value={fieldValue}
                        onChange={(event) => onChange(event.currentTarget.value)}
                        disabled
                    />
                </Box>
            );
        }

        // For data tables, use only fieldConfig.options (no API calls needed)
        const options = (fieldConfig.options || []).map(option => ({
            value: option.value,
            label: option.text
        }));
        const separator = fieldConfig.separator || ',';

        // Handle multi-select with optimization
        if (fieldConfig.multiSelect) {
            const currentValues = fieldValue ? fieldValue.split(separator).filter(Boolean) : [];
            
            return renderFieldWithBadge(
                <MultiSelect
                    key={field.id}
                    data={options}
                    value={currentValues}
                    onChange={(values) => onChange(values.join(separator))}
                    placeholder={'Search and select data tables...'}
                    disabled={disabled}
                    searchable
                    clearable
                    limit={20}
                    maxDropdownHeight={280}
                    comboboxProps={{
                        dropdownPadding: 4,
                        shadow: 'md'
                    }}
                    nothingFoundMessage="No data tables found..."
                />
            );
        }

        // Handle single select with optimization
        return renderFieldWithBadge(
            <Select
                key={field.id}
                data={options}
                value={fieldValue}
                onChange={(value) => onChange(value || '')}
                placeholder={'Search and select data table...'}
                disabled={disabled}
                searchable
                clearable
                limit={20}
                maxDropdownHeight={280}
                comboboxProps={{
                    dropdownPadding: 4,
                    shadow: 'md'
                }}
                nothingFoundMessage="No data tables found..."
            />
        );
    }

    // Select Page Keyword field - dynamic select with API options
    if (field.type === 'select-page-keyword') {
        const fieldConfig = field.fieldConfig;
        
        if (!fieldConfig) {
            return renderFieldWithBadge(
                <Box>
                    <Text size="sm" c="dimmed">No field configuration found</Text>
                    <TextInput
                        placeholder={field.default_value || ''}
                        value={fieldValue}
                        onChange={(event) => onChange(event.currentTarget.value)}
                        disabled
                    />
                </Box>
            );
        }

        // For page keywords, use only fieldConfig.options (no API calls needed)
        const options = (fieldConfig.options || []).map(option => ({
            value: option.value,
            label: option.text
        }));
        const separator = fieldConfig.separator || ',';

        // Handle multi-select with optimization
        if (fieldConfig.multiSelect) {
            const currentValues = fieldValue ? fieldValue.split(separator).filter(Boolean) : [];
            
            return renderFieldWithBadge(
                <MultiSelect
                    key={field.id}
                    data={options}
                    value={currentValues}
                    onChange={(values) => onChange(values.join(separator))}
                    placeholder={'Search and select page keywords...'}
                    disabled={disabled}
                    searchable
                    clearable
                    limit={20}
                    maxDropdownHeight={280}
                    comboboxProps={{
                        dropdownPadding: 4,
                        shadow: 'md'
                    }}
                    nothingFoundMessage="No page keywords found..."
                />
            );
        }

        // Handle single select with optimization
        return renderFieldWithBadge(
            <Select
                key={field.id}
                data={options}
                value={fieldValue}
                onChange={(value) => onChange(value || '')}
                placeholder={'Search and select page keyword...'}
                disabled={disabled}
                searchable
                clearable
                limit={20}
                maxDropdownHeight={280}
                comboboxProps={{
                    dropdownPadding: 4,
                    shadow: 'md'
                }}
                nothingFoundMessage="No page keywords found..."
            />
        );
    }
    
    // Unknown field type - show field name and type
    return renderFieldWithBadge(
        <Box>
            <Group gap="xs" mt="xs">
                <Text size="sm" c="dimmed">Unknown field type</Text>
            </Group>
            <TextInput
                placeholder={field.default_value || ''}
                value={fieldValue}
                onChange={(event) => onChange(event.currentTarget.value)}
                disabled
            />
        </Box>
    );
} 