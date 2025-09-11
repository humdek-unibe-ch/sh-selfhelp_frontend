'use client';

import { Box, Text, Stack, Badge, Group } from '@mantine/core';
import { FieldLabelWithTooltip } from '../../ui/field-label-with-tooltip/FieldLabelWithTooltip';
import {
    GlobalCreatableSelectField,
    TextInputField,
    TextareaField,
    CheckboxField,
    MonacoEditorField,
    SelectField,
    SelectIconField,
    SliderField,
    SegmentedControlField,
    UnknownField,
    ConditionBuilderField,
    DataConfigField,
    ColorPickerField
} from '../field-components';
import type { IFieldConfig } from '../../../../../types/requests/admin/fields.types';

// Global field types for section-level properties
export type GlobalFieldType = 'condition' | 'data_config' | 'css' | 'css_mobile' | 'debug';

export interface IGlobalFieldRendererProps {
    fieldType: GlobalFieldType;
    value: string | boolean;
    onChange: (value: string | boolean) => void;
    className?: string;
    disabled?: boolean;
}
import { sanitizeName, validateName } from '../../../../../utils/name-validation.utils';

// Use the actual field structure from API response
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
    translations: Array<{
        language_id: number;
        language_code?: string | null;
        content: string | null;
        meta?: any;
    }>;
    config?: IFieldConfig;
}

interface IFieldRendererProps {
    field: IFieldData;
    languageId?: number;
    value?: string | boolean; // Optional: use this value if provided, otherwise extract from field
    onChange: (value: string | boolean) => void;
    locale?: string;
    className?: string;
    disabled?: boolean;
}

export function FieldRenderer({
    field,
    languageId,
    value,
    onChange,
    locale,
    className,
    disabled = false
}: IFieldRendererProps) {
    // Skip rendering hidden fields - they should not be visible to users
    if (field.hidden === 1) {
        return null;
    }

    // Use provided value if available, otherwise extract from field translations
    const getFieldValue = (): string => {
        // If a value is explicitly provided, use it (this comes from form state)
        if (value !== undefined) {
            const stringValue = typeof value === 'string' ? value : String(value);
            return stringValue;
        }

        // Otherwise, extract from field translations (fallback for initial load)
        if (!field.translations || field.translations.length === 0) {
            const fallbackValue = field.default_value || '';
            return fallbackValue;
        }

        // For content fields (display = true), use the specific language
        if (field.display && languageId) {
            const translation = field.translations.find(t => t.language_id === languageId);
            const translationValue = translation?.content || '';
            return translationValue;
        }

        // For property fields (display = false), use language_id = 1 or language_code = "all"
        const propertyTranslation = field.translations.find(t =>
            t.language_id === 1 || t.language_code === 'all'
        );
        const propertyValue = propertyTranslation?.content || field.default_value || '';
        return propertyValue;
    };

    const fieldValue = getFieldValue();

    
    // Helper function to get field label (use title when available, fallback to name)
    const getFieldLabel = () => {
        return field.title && field.title.trim() ? field.title : field.name;
    };    
    
    // Helper function to get field type badge color
    const getFieldTypeBadgeColor = (type: string | null) => {
        switch (type) {
            case 'json': return 'orange';
            case 'markdown': return 'green';
            case 'markdown-inline': return 'teal';
            case 'text': return 'gray';
            case 'textarea': return 'indigo';
            case 'checkbox': return 'pink';
            case 'select': return 'blue';
            case 'select-icon': return 'violet';
            case 'select-css': return 'violet';
            case 'select-group': return 'cyan';
            case 'select-data_table': return 'grape';
            case 'select-page-keyword': return 'lime';
            case 'select-image': return 'lime';
            case 'select-video': return 'orange';
            case 'color-picker': return 'pink';
            case 'slider': return 'yellow';
            default: return 'red';
        }
    };

    // Helper function to render field with type badge
    const renderFieldWithBadge = (children: React.ReactNode) => {
        return (
            <Stack gap="xs" className={className}>
                <Group gap="xs" align="center">
                    <FieldLabelWithTooltip label={getFieldLabel()} tooltip={field.help || ''} locale={locale} />
                    {/* <Badge size="xs" variant="light" color={getFieldTypeBadgeColor(field.type)}>
                        {field.type || 'unknown'}
                    </Badge> */}
                </Group>
                {children}
            </Stack>
        );
    };
    
    // Handle checkbox separately as it has inline label
    if (field.type === 'checkbox') {
        // Convert string values to boolean for checkbox
        const checkboxValue = fieldValue === 'true' || fieldValue === '1' || fieldValue === 'on';
        
        return (
            <CheckboxField
                fieldId={field.id}
                fieldName={field.name}
                fieldTitle={field.title}
                value={checkboxValue}
                onChange={onChange}
                help={field.help || ''}
                locale={locale}
                disabled={disabled}
            />
        );
    }
    

    
    // JSON field - use Monaco Editor
    if (field.type === 'json') {
        return renderFieldWithBadge(
            <MonacoEditorField
                fieldId={field.id}
                value={fieldValue}
                onChange={onChange}
                language="json"
                height={250}
                disabled={disabled}
            />
        );
    }
    
    // Markdown field - use Monaco Editor
    if (field.type === 'markdown') {
        return renderFieldWithBadge(
            <MonacoEditorField
                fieldId={field.id}
                value={fieldValue}
                onChange={onChange}
                language="markdown"
                height={300}
                disabled={disabled}
            />
        );
    }
    
    // Textarea field
    if (field.type === 'textarea') {
        return renderFieldWithBadge(
            <TextareaField
                fieldId={field.id}
                value={fieldValue}
                onChange={onChange}
                placeholder={field.default_value || ''}
                disabled={disabled}
                {...(field.name === 'name' ? { validator: validateName, sanitize: sanitizeName } : {})}
            />
        );
    }
    
    // Text and markdown-inline fields
    if (field.type === 'text' || field.type === 'markdown-inline') {
        return renderFieldWithBadge(
            <TextInputField
                fieldId={field.id}
                value={fieldValue}
                onChange={onChange}
                placeholder={field.default_value || ''}
                disabled={disabled}
                {...(field.name === 'name' ? { validator: validateName, sanitize: sanitizeName } : {})}
            />
        );
    }

    // Select CSS field - dynamic select with API options
    if (field.type === 'select-css') {
        if (!field.config) {
            return renderFieldWithBadge(
                <Box>
                    <Text size="sm" c="dimmed">No field configuration found</Text>
                    <TextInputField
                        fieldId={field.id}
                        value={fieldValue}
                        onChange={onChange}
                        placeholder={field.default_value || ''}
                        disabled={true}
                    />
                </Box>
            );
        }

        return renderFieldWithBadge(
            <GlobalCreatableSelectField
                fieldId={field.id}
                config={field.config}
                value={fieldValue}
                onChange={onChange}
                disabled={disabled}
            />
        );
    }

    // Select Group field
    if (field.type === 'select-group') {
        if (!field.config) {
            return renderFieldWithBadge(
                <Box>
                    <Text size="sm" c="dimmed">No field configuration found</Text>
                    <TextInputField
                        fieldId={field.id}
                        value={fieldValue}
                        onChange={onChange}
                        placeholder={field.default_value || ''}
                        disabled={true}
                    />
                </Box>
            );
        }

        return renderFieldWithBadge(
            <SelectField
                fieldId={field.id}
                config={field.config}
                value={fieldValue}
                onChange={onChange}
                placeholder="Search and select group..."
                disabled={disabled}
            />
        );
    }   

    // Select Data Table field
    if (field.type === 'select-data_table') {
        if (!field.config) {
            return renderFieldWithBadge(
                <Box>
                    <Text size="sm" c="dimmed">No field configuration found</Text>
                    <TextInputField
                        fieldId={field.id}
                        value={fieldValue}
                        onChange={onChange}
                        placeholder={field.default_value || ''}
                        disabled={true}
                    />
                </Box>
            );
        }

        return renderFieldWithBadge(
            <SelectField
                fieldId={field.id}
                config={field.config}
                value={fieldValue}
                onChange={onChange}
                placeholder="Search and select data table..."
                disabled={disabled}
            />
        );
    }

    // Select Page Keyword field
    if (field.type === 'select-page-keyword') {
        if (!field.config) {
            return renderFieldWithBadge(
                <Box>
                    <Text size="sm" c="dimmed">No field configuration found</Text>
                    <TextInputField
                        fieldId={field.id}
                        value={fieldValue}
                        onChange={onChange}
                        placeholder={field.default_value || ''}
                        disabled={true}
                    />
                </Box>
            );
        }

        return renderFieldWithBadge(
            <SelectField
                fieldId={field.id}
                config={field.config}
                creatable={field.config.creatable}
                clearable={true}
                value={fieldValue}
                onChange={onChange}
                placeholder="Search and select page keyword..."
                disabled={disabled}
            />
        );
    }

    // Select Image field - for selecting image assets
    if (field.type === 'select-image') {
        if (!field.config) {
            return renderFieldWithBadge(
                <Box>
                    <Text size="sm" c="dimmed">No field configuration found</Text>
                    <TextInputField
                        fieldId={field.id}
                        value={fieldValue}
                        onChange={onChange}
                        placeholder={field.default_value || ''}
                        disabled={true}
                    />
                </Box>
            );
        }

        return renderFieldWithBadge(
            <SelectField
                fieldId={field.id}
                config={field.config}
                creatable={field.config.creatable}
                clearable={true}
                searchable={true}
                value={fieldValue}
                onChange={onChange}
                placeholder="Search and select image..."
                disabled={disabled}
            />
        );
    }

    // Select Video field - for selecting video assets
    if (field.type === 'select-video') {
        if (!field.config) {
            return renderFieldWithBadge(
                <Box>
                    <Text size="sm" c="dimmed">No field configuration found</Text>
                    <TextInputField
                        fieldId={field.id}
                        value={fieldValue}
                        onChange={onChange}
                        placeholder={field.default_value || ''}
                        disabled={true}
                    />
                </Box>
            );
        }

        return renderFieldWithBadge(
            <SelectField
                fieldId={field.id}
                config={field.config}
                creatable={field.config.creatable}
                clearable={true}
                searchable={true}
                value={fieldValue}
                onChange={onChange}
                placeholder="Search and select video..."
                disabled={disabled}
            />
        );
    }

    // Generic Select field - uses options from config
    if (field.type === 'select') {
        if (!field.config) {
            return renderFieldWithBadge(
                <Box>
                    <Text size="sm" c="dimmed">No field configuration found</Text>
                    <TextInputField
                        fieldId={field.id}
                        value={fieldValue}
                        onChange={onChange}
                        placeholder={field.default_value || ''}
                        disabled={true}
                    />
                </Box>
            );
        }

        return renderFieldWithBadge(
            <SelectField
                fieldId={field.id}
                config={field.config}
                creatable={field.config.creatable}
                clearable={field.config.clearable}
                searchable={field.config.searchable}
                value={fieldValue}
                onChange={onChange}
                placeholder="Select an option..."
                disabled={disabled}
            />
        );
    }

    // Select Icon field - dynamic Tabler icons
    if (field.type === 'select-icon') {
        return renderFieldWithBadge(
            <SelectIconField
                fieldId={field.id}
                config={field.config || {}}
                value={fieldValue}
                onChange={onChange}
                placeholder="Search and select icon..."
                disabled={disabled}
            />
        );
    }

    // Color Picker field
    if (field.type === 'color-picker') {
        return renderFieldWithBadge(
            <ColorPickerField
                fieldId={field.id}
                fieldName={field.name}
                fieldTitle={field.title || undefined}
                value={fieldValue}
                onChange={onChange}
                help={field.help || undefined}
                config={field.config}
                disabled={disabled}
            />
        );
    }

    // Slider field (for size/radius controls)
    if (field.type === 'slider') {
        return renderFieldWithBadge(
            <SliderField
                fieldId={field.id}
                fieldName={field.name}
                fieldTitle={field.title}
                value={fieldValue}
                onChange={onChange}
                config={field.config}
                disabled={disabled}
            />
        );
    }

    // Segment field (for segmented control options)
    if (field.type === 'segment') {
        return renderFieldWithBadge(
            <SegmentedControlField
                fieldId={field.id}
                config={field.config || {}}
                value={fieldValue}
                onChange={onChange}
                placeholder={field.title || field.name}
                disabled={disabled}
            />
        );
    }

    // Unknown field type
    return renderFieldWithBadge(
        <UnknownField
            fieldId={field.id}
            fieldType={field.type}
            value={fieldValue}
            onChange={onChange}
            placeholder={field.default_value || ''}
        />
    );
}

/**
 * Global Field Renderer for section-level properties
 * These fields are fixed and handled directly based on fieldType
 */
export function GlobalFieldRenderer({
    fieldType,
    value,
    onChange,
    className,
    disabled = false
}: IGlobalFieldRendererProps) {
    const fieldValue = typeof value === 'string' ? value : String(value);

    // Handle debug field - checkbox
    if (fieldType === 'debug') {
        const checkboxValue = fieldValue === 'true' || fieldValue === '1' || fieldValue === 'on' || value === true;

        return (
            <Box className={className}>
                <CheckboxField
                    fieldId={0}
                    fieldName={fieldType}
                    fieldTitle="Debug Mode"
                    value={checkboxValue}
                    onChange={onChange}
                    help="Enable debug mode for this section"
                    disabled={disabled}
                />
            </Box>
        );
    }

    // Handle condition field - condition builder
    if (fieldType === 'condition') {
        return (
            <Stack gap="xs" className={className}>
                <FieldLabelWithTooltip
                    label="Condition"
                    tooltip="JavaScript expression that determines section visibility. Leave empty for always visible."
                />
                <ConditionBuilderField
                    fieldId={0}
                    fieldName={fieldType}
                    value={fieldValue}
                    onChange={onChange}
                    disabled={disabled}
                    placeholder='Enter JavaScript condition (e.g., field.value > 0 && field.status === "active")'
                />
            </Stack>
        );
    }

    // Handle data_config field - data config builder
    if (fieldType === 'data_config') {
        return (
            <Stack gap="xs" className={className}>
                <FieldLabelWithTooltip
                    label="Data Config"
                    tooltip="JSON configuration for section data handling and validation."
                />
                <DataConfigField
                    fieldId={0}
                    fieldName={fieldType}
                    value={fieldValue}
                    onChange={onChange}
                    disabled={disabled}
                    placeholder='Enter JSON configuration (e.g., {"type": "array", "items": {"type": "string"}})'
                />
            </Stack>
        );
    }

    // Handle CSS fields - custom CSS field selector
    if (fieldType === 'css' || fieldType === 'css_mobile') {
        const config: IFieldConfig = {
            multiSelect: true,
            creatable: true,
            separator: ' ',
            options: []
        };

        const title = fieldType === 'css' ? 'Custom CSS' : 'Mobile CSS';
        const tooltip = fieldType === 'css'
            ? 'Select CSS classes to apply to the section container.'
            : 'Select CSS classes for mobile-specific styling.';

        return (
            <Stack gap="xs" className={className}>
                <FieldLabelWithTooltip
                    label={title}
                    tooltip={tooltip}
                />
                <GlobalCreatableSelectField
                    fieldId={0}
                    config={config}
                    value={fieldValue}
                    onChange={onChange}
                    disabled={disabled}
                />
            </Stack>
        );
    }

    // Fallback for unknown field types
    return (
        <Stack gap="xs" className={className}>
            <FieldLabelWithTooltip
                label={fieldType}
                tooltip={`Configuration for ${fieldType}`}
            />
            <TextInputField
                fieldId={0}
                value={fieldValue}
                onChange={onChange}
                placeholder={`Enter ${fieldType} value`}
                disabled={disabled}
            />
        </Stack>
    );
} 