'use client';

import {
    TextInput,
    Textarea,
    Checkbox,
    Box,
    Group,
    Text,
    Code
} from '@mantine/core';
import { FieldLabelWithTooltip } from '../../../ui/field-label-with-tooltip/FieldLabelWithTooltip';

export interface IFieldData {
    id: number;
    name: string;
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
    const fieldValue = typeof value === 'string' ? value : String(value);
    
    if (field.type === 'checkbox') {
        return (
            <Checkbox
                key={field.id}
                label={<FieldLabelWithTooltip label={field.name} tooltip={field.help || ''} locale={locale} />}
                checked={!!value}
                onChange={(event) => onChange(event.currentTarget.checked)}
                disabled={disabled}
                className={className}
            />
        );
    }
    
    if (field.type === 'textarea') {
        return (
            <Textarea
                key={field.id}
                className={className}
                label={<FieldLabelWithTooltip label={field.name} tooltip={field.help || ''} locale={locale} />}
                placeholder={field.default_value || ''}
                value={fieldValue}
                onChange={(event) => onChange(event.currentTarget.value)}
                disabled={disabled}
                autosize
                minRows={3}
            />
        );
    }
    
    if (field.type === 'text' || field.type === 'markdown-inline') {
        return (
            <TextInput
                key={field.id}
                className={className}
                label={<FieldLabelWithTooltip label={field.name} tooltip={field.help || ''} locale={locale} />}
                placeholder={field.default_value || ''}
                value={fieldValue}
                onChange={(event) => onChange(event.currentTarget.value)}
                disabled={disabled}
            />
        );
    }
    
    // Unknown field type - show field name and type
    return (
        <Box key={field.id} className={className}>
            <FieldLabelWithTooltip label={field.name} tooltip={field.help || ''} locale={locale} />
            <Group gap="xs" mt="xs">
                <Text size="sm" c="dimmed">Unknown field type:</Text>
                <Code color="red">{field.type || 'null'}</Code>
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