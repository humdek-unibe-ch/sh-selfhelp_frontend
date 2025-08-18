'use client';

import { useMemo } from 'react';

export interface ILanguage {
    id: number;
    language: string;
    locale: string;
}

export interface IFieldTranslation {
    language_id: number;
    gender_id: number;
    content: string | null;
    meta: string | null | object;
}

export interface IFormField {
    id: number;
    name: string;
    type: string | null;
    default_value: string | null;
    help: string | null;
    disabled: boolean;
    hidden: number;
    display: boolean;
    translations: IFieldTranslation[];
}

export interface IProcessedFormData {
    contentFields: Record<string, Record<number, string>>;
    propertyFields: Record<string, string | boolean>;
}

export interface IFieldFormHandlerProps {
    fields: IFormField[];
    languages: ILanguage[];
    componentName?: string;
}

export function useFieldFormHandler({ fields, languages, componentName = 'FieldFormHandler' }: IFieldFormHandlerProps) {
    
    const processedData = useMemo<IProcessedFormData>(() => {
        if (!fields.length || !languages.length) {
            return {
                contentFields: {},
                propertyFields: {}
            };
        }

        // Separate content fields (display: true) from property fields (display: false)
        const contentFields = fields.filter(field => field.display);
        const propertyFields = fields.filter(field => !field.display);

        // Process content fields (translatable)
        const contentFieldsObject: Record<string, Record<number, string>> = {};
        contentFields.forEach(field => {
            contentFieldsObject[field.name] = {};

            // Initialize all languages with empty strings first
            languages.forEach(lang => {
                contentFieldsObject[field.name][lang.id] = '';
            });

            // Then populate with actual data from translations
            field.translations.forEach(translation => {

                // Find matching language by ID
                const matchingLang = languages.find(lang => lang.id === translation.language_id);

                if (matchingLang) {
                    const value = translation.content || field.default_value || '';
                    contentFieldsObject[field.name][matchingLang.id] = value;
                }
            });

        });

        // Process property fields (non-translatable)
        const propertyFieldsObject: Record<string, string | boolean> = {};
        propertyFields.forEach(field => {

            // For property fields, use the first translation or empty
            const propertyTranslation = field.translations.length > 0 ? field.translations[0] : null;

            const value = propertyTranslation?.content || field.default_value || '';

            // Convert to appropriate type based on field type
            if (field.type === 'checkbox') {
                propertyFieldsObject[field.name] = value === '1' || value === 'true' || value === 'on';
            } else {
                propertyFieldsObject[field.name] = value;
            }

        });

        const result = {
            contentFields: contentFieldsObject,
            propertyFields: propertyFieldsObject
        };

        return result;
    }, [fields, languages, componentName]);

    return processedData;
}

/**
 * Utility function to create form change handlers
 */
export function createFieldChangeHandlers<T extends Record<string, any>>(
    setFormValues: React.Dispatch<React.SetStateAction<T>>,
    componentName?: string
) {
    const handleContentFieldChange = (fieldName: string, languageId: number | null, value: string | boolean) => {
        if (!languageId) return;

        setFormValues(prev => ({
            ...prev,
            fields: {
                ...prev.fields,
                [fieldName]: {
                    ...prev.fields[fieldName],
                    [languageId]: String(value)
                }
            }
        }));
    };

    const handlePropertyFieldChange = (fieldName: string, languageId: number | null, value: string | boolean) => {

        setFormValues(prev => {
            const newFormValues = {
                ...prev,
                properties: {
                    ...prev.properties,
                    [fieldName]: value
                }
            };
            return newFormValues;
        });
    };

    return {
        handleContentFieldChange,
        handlePropertyFieldChange
    };
} 