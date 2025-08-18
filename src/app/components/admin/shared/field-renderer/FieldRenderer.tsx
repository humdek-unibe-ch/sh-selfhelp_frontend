'use client';

import { Box, Text, Stack, Badge, Group } from '@mantine/core';
import { FieldLabelWithTooltip } from '../../../ui/field-label-with-tooltip/FieldLabelWithTooltip';
import {
    CustomCssField,
    TextInputField,
    TextareaField,
    CheckboxField,
    MonacoEditorField,
    SelectField,
    UnknownField,
    ConditionBuilderField,
    DataConfigField
} from '../field-components';
import type { IFieldConfig } from '../../../../../types/requests/admin/fields.types';
import { sanitizeName, validateName } from '../../../../../utils/name-validation.utils';

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
            case 'condition': return 'yellow';
            case 'data-config': return 'orange';
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
            <CheckboxField
                fieldId={field.id}
                fieldName={field.name}
                fieldTitle={field.title}
                value={!!value}
                onChange={onChange}
                help={field.help || ''}
                locale={locale}
                disabled={disabled}
            />
        );
    }
    
    // CSS field - use Monaco Editor
    if (field.type === 'css') {
        return renderFieldWithBadge(
            <MonacoEditorField
                fieldId={field.id}
                value={fieldValue}
                onChange={onChange}
                language="css"
                height={250}
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
        if (!field.fieldConfig) {
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
            <CustomCssField
                fieldId={field.id}
                fieldConfig={field.fieldConfig}
                value={fieldValue}
                onChange={onChange}
                disabled={disabled}
            />
        );
    }

    // Select Group field
    if (field.type === 'select-group') {
        if (!field.fieldConfig) {
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
                fieldConfig={field.fieldConfig}
                value={fieldValue}
                onChange={onChange}
                placeholder="Search and select group..."
                disabled={disabled}
            />
        );
    }   

    // Select Data Table field
    if (field.type === 'select-data_table') {
        if (!field.fieldConfig) {
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
                fieldConfig={field.fieldConfig}
                value={fieldValue}
                onChange={onChange}
                placeholder="Search and select data table..."
                disabled={disabled}
            />
        );
    }

    // Select Page Keyword field
    if (field.type === 'select-page-keyword') {
        if (!field.fieldConfig) {
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
                fieldConfig={field.fieldConfig}
                value={fieldValue}
                onChange={onChange}
                placeholder="Search and select page keyword..."
                disabled={disabled}
            />
        );
    }

    // Condition field - use Condition Builder
    if (field.type === 'condition') {

        
        return renderFieldWithBadge(
            <ConditionBuilderField
                fieldId={field.id}
                fieldName={field.name}
                value={fieldValue}
                onChange={(value) => onChange(value)}
                disabled={disabled}
                placeholder={field.default_value || ''}
            />
        );
    }

    // Data Config field - use Data Config Builder
    if (field.type === 'data-config') {
        return renderFieldWithBadge(
            <DataConfigField
                fieldId={field.id}
                fieldName={field.name}
                value={fieldValue}
                onChange={(value) => onChange(value)}
                disabled={disabled}
                placeholder={field.default_value || ''}
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