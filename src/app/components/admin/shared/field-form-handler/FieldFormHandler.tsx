'use client';

import { useMemo } from 'react';
import { debug } from '../../../../../utils/debug-logger';

export interface ILanguage {
    id: number;
    code: string;
    language: string;
    locale: string;
}

export interface IFieldTranslation {
    language_id: number;
    language_code: string | null;
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
    contentFields: Record<string, Record<string, string>>;
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
        const contentFieldsObject: Record<string, Record<string, string>> = {};
        contentFields.forEach(field => {
            contentFieldsObject[field.name] = {};

            // Initialize all languages with empty strings first
            languages.forEach(lang => {
                contentFieldsObject[field.name][lang.code] = '';
            });

            // Then populate with actual data from translations
            field.translations.forEach(translation => {
                debug('Processing translation', componentName, {
                    fieldName: field.name,
                    translationLanguageCode: translation.language_code,
                    translationContent: translation.content,
                    availableLanguages: languages.map(l => ({ code: l.code, locale: l.locale }))
                });

                // Try multiple matching strategies
                let matchingLang = null;

                // Strategy 1: Match by exact locale
                if (translation.language_code) {
                    matchingLang = languages.find(lang => lang.locale === translation.language_code);
                }

                // Strategy 2: Match by language code (first part of locale)
                if (!matchingLang && translation.language_code) {
                    const langCode = translation.language_code.split('-')[0];
                    matchingLang = languages.find(lang => lang.code === langCode);
                }

                // Strategy 3: Match by language code directly
                if (!matchingLang && translation.language_code) {
                    matchingLang = languages.find(lang => lang.code === translation.language_code);
                }

                if (matchingLang) {
                    const value = translation.content || field.default_value || '';
                    contentFieldsObject[field.name][matchingLang.code] = value;

                    debug('Translation matched and applied', componentName, {
                        fieldName: field.name,
                        translationLanguageCode: translation.language_code,
                        matchedLanguageCode: matchingLang.code,
                        value: value
                    });
                } else {
                    debug('Translation not matched to any language', componentName, {
                        fieldName: field.name,
                        translationLanguageCode: translation.language_code,
                        availableLanguageCodes: languages.map(l => l.code),
                        availableLanguageLocales: languages.map(l => l.locale)
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
                    language_code: t.language_code, 
                    content: t.content 
                }))
            });

            // For property fields, look for translation with language_code 'property' or use first translation
            let propertyTranslation = field.translations.find(t => t.language_code === 'property');

            // If no 'property' translation found, use the first translation or empty
            if (!propertyTranslation && field.translations.length > 0) {
                propertyTranslation = field.translations[0];
            }

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
    const handleContentFieldChange = (fieldName: string, languageCode: string | null, value: string | boolean) => {
        if (!languageCode) return;

        debug('Content field changed', componentName, {
            fieldName,
            languageCode,
            value
        });

        setFormValues(prev => ({
            ...prev,
            fields: {
                ...prev.fields,
                [fieldName]: {
                    ...prev.fields[fieldName],
                    [languageCode]: String(value)
                }
            }
        }));
    };

    const handlePropertyFieldChange = (fieldName: string, languageCode: string | null, value: string | boolean) => {
        debug('Property field changed', componentName, {
            fieldName,
            value
        });

        setFormValues(prev => ({
            ...prev,
            properties: {
                ...prev.properties,
                [fieldName]: value
            }
        }));
    };

    return {
        handleContentFieldChange,
        handlePropertyFieldChange
    };
} 