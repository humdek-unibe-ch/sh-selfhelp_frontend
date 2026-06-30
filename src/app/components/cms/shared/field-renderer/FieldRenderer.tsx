/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState } from 'react';
import { Box, Text, Stack, Group, Select } from '@mantine/core';
import { FieldLabelWithTooltip } from '../../ui/field-label-with-tooltip/FieldLabelWithTooltip';
import {
    GlobalCreatableSelectField,
    TextInputField,
    RichTextField,
    TextInputWithMentions,
    CheckboxField,
    SelectField,
    SelectIconField,
    SliderField,
    SegmentedControlField,
    UnknownField,
    ConditionBuilderField,
    DataConfigField,
    ColorPickerField,
    SpacingField,
    MonacoEditorField
} from '../field-components';
import type { IFieldConfig } from '../../../../../types/requests/admin/fields.types';
import { extractFieldHelpExample } from '../../../../../utils/field-help.utils';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { usePublicLanguages } from '../../../../../hooks/useLanguages';
import { usePluginFieldRenderer } from '../../../frontend/plugin-runtime';

// Global field types for section-level properties
export type GlobalFieldType = 'condition' | 'data_config' | 'css' | 'css_mobile' | 'debug';

export interface IGlobalFieldRendererProps {
    fieldType: GlobalFieldType;
    value: string | boolean;
    onChange: (value: string | boolean) => void;
    className?: string;
    disabled?: boolean;
    dataVariables?: Record<string, string>;
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
        meta?: unknown;
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
    dataVariables?: Record<string, string>;
    /**
     * Show the email "Style" preset dropdown on rich-text (textarea) fields.
     * Set by the mail-config editor so only email bodies get email presets
     * (issue #56 mail editor).
     */
    emailStyles?: boolean;
}

/**
 * `text` / `markdown-inline` fields whose value is a structural identifier or a
 * predefined option value, NOT user-facing copy: rendered as a plain input with
 * its own validation and no interpolation picker. Everything else of these types
 * is a single-line mention editor. The richer/longer content uses the dedicated
 * `textarea` (rich text) and `markdown` / `json` / `css` / `code` types instead,
 * so the editor is driven purely by field TYPE (issue #56).
 */
const PLAIN_IDENTIFIER_FIELD_NAMES = new Set(['name', 'value', 'title']);

// Props shared by the select-language / select-timezone branch components.
// These are extracted into dedicated components so their data hooks are called
// unconditionally at the top level of a component (React rules of hooks),
// instead of inside `if (field.type === ...)` branches of FieldRenderer.
interface ISelectBranchFieldProps {
    fieldId: number;
    fieldValue: string;
    onChange: (value: string | boolean) => void;
    disabled: boolean;
}

// Select Language field - dropdown from public languages
function SelectLanguageField({ fieldId, fieldValue, onChange, disabled }: ISelectBranchFieldProps) {
    const { languages: languageOptions, isLoading: languagesLoading } = usePublicLanguages();

    // Local state to ensure proper updates like in the timezone field.
    const [localValue, setLocalValue] = useState<string>(() => (fieldValue ? fieldValue.toString() : ''));

    // Sync with prop changes — render-phase update tracking the previous prop
    // (matching the previous effect's [fieldValue] dependency).
    const [prevFieldValue, setPrevFieldValue] = useState(fieldValue);
    if (prevFieldValue !== fieldValue) {
        setPrevFieldValue(fieldValue);
        setLocalValue(fieldValue ? fieldValue.toString() : '');
    }

    return (
        <Select
            key={fieldId}
            data={languageOptions.map(lang => ({
                value: lang.id.toString(),
                label: lang.language
            }))}
            value={localValue}
            onChange={(value) => {
                const newValue = value || '';
                setLocalValue(newValue);
                onChange(newValue);
            }}
            placeholder="Select a language..."
            searchable
            required
            disabled={disabled || languagesLoading}
            allowDeselect={false}
        />
    );
}

// Select Timezone field - dropdown from timezone lookups
function SelectTimezoneField({ fieldId, fieldValue, onChange, disabled }: ISelectBranchFieldProps) {
    const timezoneLookups = useLookupsByType('timezones');

    // Local state to ensure proper updates like in ProfileStyle.tsx.
    const [localValue, setLocalValue] = useState<string>(() => (fieldValue ? fieldValue.toString() : ''));

    // Sync with prop changes — render-phase update tracking the previous prop
    // (matching the previous effect's [fieldValue] dependency).
    const [prevFieldValue, setPrevFieldValue] = useState(fieldValue);
    if (prevFieldValue !== fieldValue) {
        setPrevFieldValue(fieldValue);
        setLocalValue(fieldValue ? fieldValue.toString() : '');
    }

    return (
        <Select
            key={fieldId}
            data={timezoneLookups.map(tz => ({
                value: tz.id.toString(),
                label: `${tz.lookupCode} - ${tz.lookupDescription}`
            }))}
            value={localValue}
            onChange={(value) => {
                const newValue = value || '';
                setLocalValue(newValue);
                onChange(newValue);
            }}
            placeholder="Select a timezone..."
            searchable
            required
            disabled={disabled}
            allowDeselect={false}
        />
    );
}

export function FieldRenderer(props: IFieldRendererProps & { dataVariables?: Record<string, string> }) {
    const { field, languageId, value, onChange, locale, className, disabled = false, dataVariables, emailStyles = false } = props;

    // Plugin-supplied editor renderers take priority over host built-ins so
    // plugin-owned field types (e.g. `select-survey-js`) stay inside the
    // plugin bundle. Returns undefined for any field type no plugin claimed.
    const pluginFieldRenderer = usePluginFieldRenderer(field.type);

    // Skip rendering hidden fields - they should not be visible to users
    if (field.hidden === 1) {
        return null;
    }


    // Use provided value if available, otherwise extract from field translations
    const getFieldValue = (): string => {
        // If a value is explicitly provided, use it (this comes from form state)
        if (value !== undefined && value !== null) {
            return typeof value === 'string' ? value : String(value);
        }

        // Otherwise, extract from field translations (fallback for initial load)
        if (!field.translations || field.translations.length === 0) {
            return field.default_value ? String(field.default_value) : '';
        }

        // For content fields (display = true), use the specific language
        if (field.display && languageId) {
            const translation = field.translations.find(t => t.language_id === languageId);
            return translation?.content ? String(translation.content) : '';
        }

        // For property fields (display = false), use language_id = 1 or language_code = "all"
        const propertyTranslation = field.translations.find(t =>
            t.language_id === 1 || t.language_code === 'all'
        );
        if (propertyTranslation?.content) {
            return String(propertyTranslation.content);
        }

        // Fallback to default value or empty string
        return field.default_value ? String(field.default_value) : '';
    };

    const fieldValue = getFieldValue();

    
    // Helper function to get field label (use title when available, fallback to name)
    const getFieldLabel = () => {
        return field.title && field.title.trim() ? field.title : field.name;
    };    
    
    // Helper function to get field type badge color
    const _getFieldTypeBadgeColor = (type: string | null) => {
        switch (type) {
            case 'json': return 'orange';
            case 'markdown': return 'green';
            case 'markdown-inline': return 'teal';
            case 'text': return 'gray';
            case 'textarea': return 'indigo';
            case 'checkbox': return 'pink';
            case 'select': return 'blue';
            case 'select-language': return 'green';
            case 'select-timezone': return 'purple';
            case 'select-icon': return 'violet';
            case 'select-css': return 'violet';
            case 'select-group': return 'cyan';
            case 'select-data_table': return 'grape';
            case 'select-page-keyword': return 'lime';
            case 'select-image': return 'lime';
            case 'select-video': return 'orange';
            case 'color-picker': return 'pink';
            case 'slider': return 'yellow';
            case 'spacing_margin': return 'orange';
            case 'manitne_spacing': return 'blue';
            default: return 'red';
        }
    };

    // Surface a copy-able example (from default_value or the help text) in the
    // field's help popover for structured fields (issue #56 field audit).
    const helpExample = extractFieldHelpExample(field.type, field.default_value, field.help);

    // Helper function to render field with type badge
    const renderFieldWithBadge = (children: React.ReactNode) => {
        return (
            <Stack gap="xs" className={className}>
                <Group gap="xs" align="center">
                    <FieldLabelWithTooltip
                        label={getFieldLabel()}
                        tooltip={field.help || ''}
                        locale={locale}
                        example={helpExample?.code}
                        exampleLanguage={helpExample?.language}
                    />
                    {/* <Badge size="xs" variant="light" color={getFieldTypeBadgeColor(field.type)}>
                        {field.type || 'unknown'}
                    </Badge> */}
                </Group>
                {children}
            </Stack>
        );
    };
    
    // Plugin-supplied renderers win over host built-ins. This is the only
    // hook plugins need to ship custom field editors for plugin-owned
    // field types (e.g. SurveyJS' `select-survey-js`). The host wraps the
    // plugin output with the standard label / tooltip / type badge so the
    // editor surface stays visually consistent.
    if (pluginFieldRenderer) {
        return renderFieldWithBadge(
            pluginFieldRenderer({
                fieldId: field.id,
                fieldName: field.name,
                fieldType: field.type ?? '',
                value: fieldValue,
                onChange: (next) => onChange(next),
                disabled,
                field: field as unknown as Record<string, unknown>,
            }) as React.ReactNode,
        );
    }

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
    

    
    // JSON field - use Monaco Editor with `{{` variable completion (issue #56 v2)
    if (field.type === 'json') {
        return renderFieldWithBadge(
            <MonacoEditorField
                fieldId={field.id}
                value={fieldValue}
                onChange={onChange}
                language="json"
                height={250}
                disabled={disabled}
                dataVariables={dataVariables}
            />
        );
    }
    
    // Markdown field - use Monaco Editor with `{{` variable completion (issue #56 v2)
    if (field.type === 'markdown') {
        return renderFieldWithBadge(
            <MonacoEditorField
                fieldId={field.id}
                value={fieldValue}
                onChange={onChange}
                language="markdown"
                height={300}
                disabled={disabled}
                dataVariables={dataVariables}
            />
        );
    }
    
    // Code field - raw markup (e.g. html_tag_content) in a Monaco HTML editor with
    // `{{` variable completion. Hand-written HTML must NOT go through the WYSIWYG,
    // which would normalise/strip it (issue #56 field-type cleanup).
    if (field.type === 'code') {
        return renderFieldWithBadge(
            <MonacoEditorField
                fieldId={field.id}
                value={fieldValue}
                onChange={onChange}
                language="html"
                height={300}
                disabled={disabled}
                dataVariables={dataVariables}
            />
        );
    }

    // Textarea field - now uses rich text editor
    if (field.type === 'textarea') {
        // Prepare props conditionally to avoid inline object creation
        const richTextProps: React.ComponentProps<typeof RichTextField> & { sanitize?: typeof sanitizeName } = {
            fieldId: field.id,
            value: fieldValue,
            onChange: onChange,
            placeholder: field.default_value || '',
            disabled: disabled,
            dataVariables: dataVariables,
            emailStyles: emailStyles
        };
        
        if (field.name === 'name') {
            richTextProps.validator = validateName;
            richTextProps.sanitize = sanitizeName;
        }
        
        return renderFieldWithBadge(<RichTextField {...richTextProps} />);
    }

    // Text and markdown-inline fields - single-line mention editors. Structural
    // identifiers / predefined values stay plain inputs (no interpolation); every
    // other text field gets the `{{ }}` picker. Longer / multiline / rich copy is
    // authored through the `textarea` (rich text) type, so this is type-driven and
    // never grows into a fake multiline box (issue #56).
    if (field.type === 'text' || field.type === 'markdown-inline') {
        if (PLAIN_IDENTIFIER_FIELD_NAMES.has(field.name)) {
            return renderFieldWithBadge(
                <TextInputField
                    fieldId={field.id}
                    value={fieldValue}
                    onChange={onChange}
                />
            );
        }

        // Only `markdown-inline` fields may carry inline formatting (bold / italic
        // / underline / link) — those tags survive to the web + mobile renderers.
        // Plain `text` fields disable the shortcuts so no `<strong>` etc. is ever
        // saved into a slot that is meant to stay plain text.
        const allowInlineFormatting = field.type === 'markdown-inline';
        const textInputProps: React.ComponentProps<typeof TextInputWithMentions> = {
            fieldId: field.id,
            value: fieldValue,
            onChange: onChange,
            placeholder: field.default_value || '',
            disabled: disabled,
            dataVariables: dataVariables,
            enableRichTextShortcuts: allowInlineFormatting,
        };

        return renderFieldWithBadge(<TextInputWithMentions {...textInputProps} />);
    }

    if (field.type === 'time') {
        return renderFieldWithBadge(
            <TextInputField
                fieldId={field.id}
                value={fieldValue}
                onChange={onChange}
                placeholder={field.default_value || '00:00'}
                inputType="time"
            />
        );
    }

    if (field.type === 'number') {
        return renderFieldWithBadge(
            <TextInputField
                fieldId={field.id}
                value={fieldValue}
                onChange={onChange}
                placeholder={field.default_value || '0'}
                inputType="number"
                step="any"
                disabled={disabled}
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
                dataVariables={dataVariables}
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
                dataVariables={dataVariables}
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
                dataVariables={dataVariables}
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
                clearable={field.config.clearable}
                searchable={field.config.searchable}
                value={fieldValue}
                onChange={onChange}
                placeholder="Search and select page keyword..."
                disabled={disabled}
                dataVariables={dataVariables}
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
                dataVariables={dataVariables}
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
                dataVariables={dataVariables}
            />
        );
    }

    // Select Language field - dropdown from public languages
    if (field.type === 'select-language') {
        return renderFieldWithBadge(
            <SelectLanguageField
                fieldId={field.id}
                fieldValue={fieldValue}
                onChange={onChange}
                disabled={disabled}
            />
        );
    }

    // Select Timezone field - dropdown from timezone lookups
    if (field.type === 'select-timezone') {
        return renderFieldWithBadge(
            <SelectTimezoneField
                fieldId={field.id}
                fieldValue={fieldValue}
                onChange={onChange}
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
                dataVariables={dataVariables}
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

    // Spacing field (margin-only or margin + padding)
    if (field.type === 'spacing' || field.type === 'spacing-margin') {
        return renderFieldWithBadge(
            <SpacingField
                fieldId={field.id}
                fieldName={field.name}
                fieldTitle={field.title || undefined}
                fieldType={field.type}
                value={fieldValue}
                onChange={onChange}
                disabled={disabled}
            />
        );
    }

    // CSS field - use Monaco Editor with `{{` variable completion (issue #56 v2)
    if (field.type === 'css') {
        return renderFieldWithBadge(
            <MonacoEditorField
                fieldId={field.id}
                value={fieldValue}
                onChange={onChange}
                language="css"
                height={400}
                disabled={disabled}
                dataVariables={dataVariables}
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
    disabled = false,
    dataVariables
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
                    dataVariables={dataVariables}
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
                    tooltip="JSON configuration that loads data for this section so it can be interpolated with {{scope.field}}."
                    example={'[\n  {\n    "scope": "my_form",\n    "table": "my_form",\n    "retrieve": "first",\n    "fields": [{ "field_name": "name", "field_holder": "name" }]\n  }\n]'}
                    exampleLanguage="json"
                />
                <DataConfigField
                    fieldId={0}
                    fieldName={fieldType}
                    value={fieldValue}
                    onChange={onChange}
                    disabled={disabled}
                    placeholder='Enter JSON configuration (e.g., {"type": "array", "items": {"type": "string"}})'
                    dataVariables={dataVariables}
                />
            </Stack>
        );
    }

    if (fieldType === 'css' || fieldType === 'css_mobile') {
        const config: IFieldConfig = {
            multiSelect: true,
            creatable: true,
            separator: ' ',
            options: []
        };

        const isMobile = fieldType === 'css_mobile';
        const title = isMobile ? 'Mobile CSS' : 'Custom CSS';
        const tooltip = isMobile
            ? 'CSS classes that only apply on mobile viewports (auto-prefixed with `max-md:` on web). The dropdown is filtered to the curated mobile-safe allow-list — picking a class here means the native mobile renderer will also understand it.'
            : 'Select CSS classes to apply to the section container.';

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
                    dataVariables={dataVariables}
                    target={isMobile ? 'mobile' : 'web'}
                />
            </Stack>
        );
    }
    } 
