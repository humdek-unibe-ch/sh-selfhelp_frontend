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
import { useInspectorStore, INSPECTOR_TYPES } from '../../../../../store/inspectorStore';

interface IFieldsSectionProps {
    title: string;
    fields: IFieldData[];
    languages: ILanguage[];
    fieldValues: Record<string, Record<number, string>> | Record<string, string | boolean>;
    onFieldChange: (fieldName: string, languageId: number | null, value: string | boolean) => void;
    isMultiLanguage?: boolean;
    defaultExpanded?: boolean;
    className?: string;
    inspectorType?: string;
    sectionName?: string;
}

export function FieldsSection({
    title,
    fields,
    languages,
    fieldValues,
    onFieldChange,
    isMultiLanguage = false,
    defaultExpanded = true,
    className,
    inspectorType = INSPECTOR_TYPES.SECTION,
    sectionName = title.toLowerCase().replace(/\s+/g, '-')
}: IFieldsSectionProps) {
    const { isCollapsed, setCollapsed } = useInspectorStore();
    const [activeLanguageTab, setActiveLanguageTab] = useState(languages[0]?.id?.toString() || '');

    // Get collapse state from store, default to expanded if not found
    const collapsed = isCollapsed(inspectorType, sectionName) ?? !defaultExpanded;

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

    const handleToggle = () => {
        setCollapsed(inspectorType, sectionName, !collapsed);
    };

    return (
        <Paper withBorder className={className}>
            <Box p="md">
                <Group justify="space-between" mb="md" style={{ cursor: 'pointer' }} onClick={handleToggle}>
                    <Text fw={500}>{title}</Text>
                    <ActionIcon variant="subtle">
                        {collapsed ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
                    </ActionIcon>
                </Group>

                <Collapse in={!collapsed}>
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