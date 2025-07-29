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
    Stack
} from '@mantine/core';
import { FieldLabelWithTooltip } from '../../../ui/field-label-with-tooltip/FieldLabelWithTooltip';
import { MonacoFieldEditor, TMonacoLanguage } from '../monaco-field-editor/MonacoFieldEditor';
import { useMantineColorScheme } from '@mantine/core';

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