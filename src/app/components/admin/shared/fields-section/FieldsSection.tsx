'use client';

import {
    Paper,
    Box,
    Group,
    Text,
    ActionIcon,
    Collapse,
    Tabs,
    Stack
} from '@mantine/core';
import {
    IconChevronDown,
    IconChevronUp
} from '@tabler/icons-react';
import { useState } from 'react';
import { FieldRenderer, IFieldData } from '../field-renderer/FieldRenderer';
import { ILanguage } from '../field-form-handler/FieldFormHandler';

interface IFieldsSectionProps {
    title: string;
    fields: IFieldData[];
    languages: ILanguage[];
    fieldValues: Record<string, Record<number, string>> | Record<string, string | boolean>;
    onFieldChange: (fieldName: string, languageId: number | null, value: string | boolean) => void;
    isMultiLanguage?: boolean;
    defaultExpanded?: boolean;
    className?: string;
}

export function FieldsSection({
    title,
    fields,
    languages,
    fieldValues,
    onFieldChange,
    isMultiLanguage = false,
    defaultExpanded = true,
    className
}: IFieldsSectionProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [activeLanguageTab, setActiveLanguageTab] = useState(languages[0]?.id?.toString() || '');

    if (fields.length === 0) {
        return null;
    }

    const renderField = (field: IFieldData, languageId?: number) => {
        const fieldKey = languageId ? `${field.name}.${languageId}` : field.name;
        
        let value: string | boolean;
        if (isMultiLanguage && languageId) {
            // Multi-language content fields
            value = (fieldValues as Record<string, Record<number, string>>)[field.name]?.[languageId] ?? '';
        } else {
            // Single language or property fields
            value = (fieldValues as Record<string, string | boolean>)[field.name] ?? '';
        }
        
        // Debug logging for condition and data-config fields
        if (field.type === 'condition' || field.type === 'data-config') {
            console.log(`FieldsSection: Rendering ${field.type} field "${field.name}":`, {
                fieldId: field.id,
                fieldName: field.name,
                fieldType: field.type,
                isMultiLanguage,
                languageId,
                value,
                valueType: typeof value,
                valueLength: typeof value === 'string' ? value.length : 'N/A',
                fieldValues: isMultiLanguage ? 
                    (fieldValues as Record<string, Record<number, string>>)[field.name] : 
                    (fieldValues as Record<string, string | boolean>)[field.name]
            });
        }

        const currentLanguage = languageId ? languages.find(lang => lang.id === languageId) : undefined;
        const locale = currentLanguage?.locale;

        return (
            <FieldRenderer
                key={languageId ? `${field.id}-${languageId}` : field.id}
                field={field}
                value={value}
                onChange={(newValue) => onFieldChange(field.name, languageId || null, newValue)}
                locale={locale}
                className={className}
            />
        );
    };

    return (
        <Paper withBorder>
            <Box p="md">
                <Group justify="space-between" mb="md">
                    <Text fw={500}>{title}</Text>
                    <ActionIcon
                        variant="subtle"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </ActionIcon>
                </Group>
                
                <Collapse in={expanded}>
                    {isMultiLanguage && languages.length > 1 ? (
                        <Tabs value={activeLanguageTab} onChange={(value) => setActiveLanguageTab(value || '')}>
                            <Tabs.List>
                                {languages.map(language => (
                                    <Tabs.Tab key={language.id} value={language.id.toString()}>
                                        {language.language}
                                    </Tabs.Tab>
                                ))}
                            </Tabs.List>
                            
                            {languages.map(language => (
                                <Tabs.Panel key={language.id} value={language.id.toString()} pt="md">
                                    <Stack gap="md">
                                        {fields.map(field => renderField(field, language.id))}
                                    </Stack>
                                </Tabs.Panel>
                            ))}
                        </Tabs>
                    ) : (
                        <Stack gap="md">
                            {fields.map(field => renderField(field, isMultiLanguage ? languages[0]?.id : undefined))}
                        </Stack>
                    )}
                </Collapse>
            </Box>
        </Paper>
    );
} 