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
import { useState, useEffect } from 'react';
import { useInspectorStore } from '../../../../../store/inspectorStore';
import { FieldRenderer, IFieldData } from '../../shared/field-renderer/FieldRenderer';
import { ILanguage } from '../../../../../types/responses/admin/languages.types';

export type TMinimalForm = {
    values: { fields: Record<string, Record<number, string>> };
    setFieldValue: (path: string, value: string | Record<number, string>) => void;
};

interface IInspectorFieldsProps {
    title: string;
    fields: IFieldData[];
    languages: ILanguage[];
    fieldValues?: Record<string, Record<number, string>> | Record<string, string | boolean>;
    onFieldChange?: (fieldName: string, languageId: number | null, value: string | boolean) => void;
    isMultiLanguage?: boolean;
    defaultExpanded?: boolean;
    className?: string;
    inspectorType: string; // Required for persistent state
    sectionName: string; // Consistent section name for state management
    form?: TMinimalForm;
}

export function InspectorFields({
    title,
    fields,
    languages,
    fieldValues,
    onFieldChange,
    isMultiLanguage = false,
    defaultExpanded = true,
    className,
    inspectorType,
    sectionName,
    form
}: IInspectorFieldsProps) {
    const { isCollapsed, setCollapsed } = useInspectorStore();

    // Get persistent state, fallback to defaultExpanded if no stored state
    const [expanded, setExpanded] = useState(() => {
        const storedCollapsed = isCollapsed(inspectorType, sectionName);
        return storedCollapsed ? false : defaultExpanded;
    });

    const [activeLanguageTab, setActiveLanguageTab] = useState(languages[0]?.id?.toString() || '');

    // Update persistent state when expanded changes
    useEffect(() => {
        setCollapsed(inspectorType, sectionName, !expanded);
    }, [expanded, inspectorType, sectionName, setCollapsed]);

    if (fields.length === 0) {
        return null;
    }

    const renderField = (field: IFieldData, languageId?: number) => {
        const currentLanguage = languageId ? languages.find(lang => lang.id === languageId) : undefined;
        const locale = currentLanguage?.locale;

        // Get the current field value - prioritize form over fieldValues
        let currentValue: string | boolean | undefined;
        
        const langIdToUse = isMultiLanguage && languageId ? languageId : (languages[0]?.id || 1);
        
        if (form) {
            // Primary: Get value from Mantine form
            currentValue = form.values.fields?.[field.name]?.[langIdToUse];
        } else if (fieldValues) {
            if (isMultiLanguage && languageId) {
                // Multi-language content fields
                const multiLangValues = fieldValues as Record<string, Record<number, string>>;
                currentValue = multiLangValues[field.name]?.[languageId];
            } else {
                // Single language or property fields
                const singleValues = fieldValues as Record<string, string | boolean>;
                currentValue = singleValues[field.name];
            }
        }

        // Fallback: If no value found and field has translations, try to load from translations
        if ((currentValue === undefined || currentValue === '') && field.translations) {
            const translation = field.translations.find(t => t.language_id === langIdToUse);
            if (translation && translation.content) {
                currentValue = translation.content;
                console.log('🔧 InspectorFields: Loading value from field translations:', {
                    fieldName: field.name,
                    languageId: langIdToUse,
                    translationContent: translation.content
                });
                
                // NOTE: Don't sync to form during render - this causes React setState during render errors
                // The form initialization should handle loading from translations properly
            }
        }

        console.log('🔍 InspectorFields renderField:', {
            fieldName: field.name,
            fieldType: field.type,
            isMultiLanguage,
            languageId,
            langIdToUse,
            currentValue,
            formValue: form?.values.fields?.[field.name]?.[langIdToUse],
            fieldValuesStructure: fieldValues ? Object.keys(fieldValues) : 'none',
            hasTranslations: !!field.translations,
            translationsCount: field.translations?.length || 0
        });

        console.log('field', JSON.stringify(field));

        return (
            <FieldRenderer
                key={languageId ? `${field.id}-${languageId}` : field.id}
                field={field}
                languageId={languageId}
                value={currentValue}
                onChange={(newValue) => {
                    console.log('🔍 InspectorFields onChange:', {
                        fieldName: field.name,
                        languageId,
                        oldValue: currentValue,
                        newValue
                    });
                    if (form) {
                        // Ensure the field structure exists before setting the value
                        if (!form.values.fields[field.name]) {
                            // Initialize the field object structure
                            const fieldObj = {} as Record<number, string>;
                            form.setFieldValue(`fields.${field.name}`, fieldObj);
                        }
                        const fieldKey = `fields.${field.name}.${langIdToUse}`;
                        form.setFieldValue(fieldKey, String(newValue));
                    } else if (onFieldChange) {
                        onFieldChange(field.name, languageId || null, newValue);
                    }
                }}
                locale={locale}
                className={className}
            />
        );
    };

    return (
        <Box>
            {title && (
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
            )}

            {!title && (
                <Box>
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
                </Box>
            )}
        </Box>
    );
}
