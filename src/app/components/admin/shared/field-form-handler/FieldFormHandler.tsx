'use client';

import { useMemo } from 'react';
import { debug } from '../../../../../utils/debug-logger';

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
            debug('No fields or languages available for processing', componentName, {
                fieldsCount: fields.length,
                languagesCount: languages.length
            });
            return {
                contentFields: {},
                propertyFields: {}
            };
        }

        debug('Processing fields for form', componentName, {
            fieldsCount: fields.length,
            languagesCount: languages.length,
            fields: fields.map(f => ({ 
                name: f.name, 
                type: f.type, 
                display: f.display, 
                translationsCount: f.translations.length 
            }))
        });

        // Separate content fields (display: true) from property fields (display: false)
        const contentFields = fields.filter(field => field.display);
        const propertyFields = fields.filter(field => !field.display);

        debug('Fields categorized', componentName, {
            contentFieldsCount: contentFields.length,
            propertyFieldsCount: propertyFields.length,
            contentFields: contentFields.map(f => f.name),
            propertyFields: propertyFields.map(f => f.name)
        });

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
                debug('Processing translation', componentName, {
                    fieldName: field.name,
                    translationLanguageId: translation.language_id,
                    translationContent: translation.content,
                    availableLanguages: languages.map(l => ({ id: l.id, locale: l.locale }))
                });

                // Find matching language by ID
                const matchingLang = languages.find(lang => lang.id === translation.language_id);

                if (matchingLang) {
                    const value = translation.content || field.default_value || '';
                    contentFieldsObject[field.name][matchingLang.id] = value;

                    debug('Translation matched and applied', componentName, {
                        fieldName: field.name,
                        translationLanguageId: translation.language_id,
                        matchedLanguageId: matchingLang.id,
                        value: value
                    });
                } else {
                    debug('Translation not matched to any language', componentName, {
                        fieldName: field.name,
                        translationLanguageId: translation.language_id,
                        availableLanguageIds: languages.map(l => l.id)
                    });
                }
            });

            debug('Content field processing complete', componentName, {
                fieldName: field.name,
                finalValues: contentFieldsObject[field.name]
            });
        });

        // Process property fields (non-translatable)
        const propertyFieldsObject: Record<string, string | boolean> = {};
        propertyFields.forEach(field => {
            debug('Processing property field', componentName, {
                fieldName: field.name,
                fieldType: field.type,
                translationsCount: field.translations.length,
                translations: field.translations.map(t => ({ 
                    language_id: t.language_id, 
                    content: t.content 
                }))
            });

            // For property fields, use the first translation or empty
            const propertyTranslation = field.translations.length > 0 ? field.translations[0] : null;

            const value = propertyTranslation?.content || field.default_value || '';

            // Convert to appropriate type based on field type
            if (field.type === 'checkbox') {
                propertyFieldsObject[field.name] = value === '1' || value === 'true' || value === 'on';
            } else {
                propertyFieldsObject[field.name] = value;
            }

            debug('Property field processed', componentName, {
                fieldName: field.name,
                rawValue: value,
                finalValue: propertyFieldsObject[field.name],
                fieldType: field.type
            });
        });

        const result = {
            contentFields: contentFieldsObject,
            propertyFields: propertyFieldsObject
        };

        debug('Field processing complete', componentName, {
            contentFieldsCount: Object.keys(result.contentFields).length,
            propertyFieldsCount: Object.keys(result.propertyFields).length,
            contentFields: result.contentFields,
            propertyFields: result.propertyFields
        });

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

        debug('Content field changed', componentName, {
            fieldName,
            languageId,
            value
        });

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
        debug('Property field changed', componentName, {
            fieldName,
            languageId,
            value,
            valueType: typeof value,
            valueLength: typeof value === 'string' ? value.length : 'N/A'
        });

        console.log(`[${componentName}] Property field "${fieldName}" changed:`, {
            fieldName,
            languageId,
            value,
            valueType: typeof value,
            valueLength: typeof value === 'string' ? value.length : 'N/A'
        });

        setFormValues(prev => {
            const newFormValues = {
                ...prev,
                properties: {
                    ...prev.properties,
                    [fieldName]: value
                }
            };
            
            console.log(`[${componentName}] Updated form values for "${fieldName}":`, {
                oldValue: prev.properties?.[fieldName],
                newValue: value,
                allProperties: newFormValues.properties
            });
            
            return newFormValues;
        });
    };

    return {
        handleContentFieldChange,
        handlePropertyFieldChange
    };
} 