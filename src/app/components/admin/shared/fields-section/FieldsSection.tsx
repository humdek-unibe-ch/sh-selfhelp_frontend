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

interface ILanguage {
    code: string;
    language: string;
    locale: string;
}

interface IFieldsSectionProps {
    title: string;
    fields: IFieldData[];
    languages: ILanguage[];
    fieldValues: Record<string, Record<string, string>> | Record<string, string | boolean>;
    onFieldChange: (fieldName: string, languageCode: string | null, value: string | boolean) => void;
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
    const [activeLanguageTab, setActiveLanguageTab] = useState(languages[0]?.code || '');

    if (fields.length === 0) {
        return null;
    }

    const renderField = (field: IFieldData, languageCode?: string) => {
        const fieldKey = languageCode ? `${field.name}.${languageCode}` : field.name;
        
        let value: string | boolean;
        if (isMultiLanguage && languageCode) {
            // Multi-language content fields
            value = (fieldValues as Record<string, Record<string, string>>)[field.name]?.[languageCode] ?? '';
        } else {
            // Single language or property fields
            value = (fieldValues as Record<string, string | boolean>)[field.name] ?? '';
        }

        const currentLanguage = languageCode ? languages.find(lang => lang.code === languageCode) : undefined;
        const locale = currentLanguage?.locale;

        return (
            <FieldRenderer
                key={languageCode ? `${field.id}-${languageCode}` : field.id}
                field={field}
                value={value}
                onChange={(newValue) => onFieldChange(field.name, languageCode || null, newValue)}
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
                                    <Tabs.Tab key={language.code} value={language.code}>
                                        {language.language}
                                    </Tabs.Tab>
                                ))}
                            </Tabs.List>
                            
                            {languages.map(language => (
                                <Tabs.Panel key={language.code} value={language.code} pt="md">
                                    <Stack gap="md">
                                        {fields.map(field => renderField(field, language.code))}
                                    </Stack>
                                </Tabs.Panel>
                            ))}
                        </Tabs>
                    ) : (
                        <Stack gap="md">
                            {fields.map(field => renderField(field, isMultiLanguage ? languages[0]?.code : undefined))}
                        </Stack>
                    )}
                </Collapse>
            </Box>
        </Paper>
    );
} 