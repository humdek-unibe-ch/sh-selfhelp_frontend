/**
 * Utility functions for extracting field values from translations
 * These functions handle the consistent extraction of content and property field values
 * from the API response structure with translations array
 */

import { ILanguage } from '../types/responses/admin/languages.types';

interface IFieldTranslation {
    language_id: number;
    language_code?: string;
    content: string;
    meta?: any;
}

interface IFieldWithTranslations {
    id: number;
    name: string;
    title?: string;
    type: string;
    default_value: string | null;
    help?: string;
    disabled?: boolean;
    hidden?: number;
    display: boolean;
    translations: IFieldTranslation[];
    fieldConfig?: any;
}

/**
 * Extracts content field value for a specific language
 * Content fields are translatable (display = true) and support multiple languages
 * 
 * @param field - Field object with translations array
 * @param languageId - The language ID to extract content for
 * @returns The field content for the specified language or empty string
 */
export function getContentFieldValue(field: IFieldWithTranslations, languageId: number): string {
    if (!field.translations || !Array.isArray(field.translations)) {
        return field.default_value || '';
    }

    // Find the translation for the specific language
    const translation = field.translations.find(t => t.language_id === languageId);
    
    if (translation && translation.content !== null && translation.content !== undefined) {
        return translation.content;
    }

    // Fallback to default value if no translation found
    return field.default_value || '';
}

/**
 * Extracts property field value 
 * Property fields are non-translatable (display = false) and always use language ID 1
 * 
 * @param field - Field object with translations array
 * @returns The field content from language ID 1 or empty string
 */
export function getPropertyFieldValue(field: IFieldWithTranslations): string {
    if (!field.translations || !Array.isArray(field.translations)) {
        return field.default_value || '';
    }

    // Property fields are always stored with language_id = 1
    const translation = field.translations.find(t => t.language_id === 1);
    
    if (translation && translation.content !== null && translation.content !== undefined) {
        return translation.content;
    }

    // Fallback to default value if no translation found
    return field.default_value || '';
}

/**
 * Extracts property field value as boolean
 * Useful for checkbox fields and other boolean property fields
 * 
 * @param field - Field object with translations array
 * @returns Boolean value based on the field content
 */
export function getPropertyFieldValueAsBoolean(field: IFieldWithTranslations): boolean {
    const value = getPropertyFieldValue(field);
    return value === '1' || value === 'true' || value === 'on' || value === 'yes';
}

/**
 * Initializes field values object for content fields across all languages
 * 
 * @param fields - Array of fields to process
 * @param languages - Array of available languages
 * @returns Object with structure: { fieldName: { languageId: content } }
 */
export function initializeContentFieldValues(
    fields: IFieldWithTranslations[], 
    languages: ILanguage[]
): Record<string, Record<number, string>> {
    const fieldValues: Record<string, Record<number, string>> = {};

    // Only process content fields (display = true)
    const contentFields = fields.filter(field => field.display);

    contentFields.forEach(field => {
        fieldValues[field.name] = {};
        
        languages.forEach(language => {
            fieldValues[field.name][language.id] = getContentFieldValue(field, language.id);
        });
    });

    return fieldValues;
}

/**
 * Initializes field values object for property fields
 * 
 * @param fields - Array of fields to process
 * @returns Object with structure: { fieldName: value }
 */
export function initializePropertyFieldValues(
    fields: IFieldWithTranslations[]
): Record<string, string | boolean> {
    const fieldValues: Record<string, string | boolean> = {};

    // Only process property fields (display = false)
    const propertyFields = fields.filter(field => !field.display);

    propertyFields.forEach(field => {
        if (field.type === 'checkbox') {
            fieldValues[field.name] = getPropertyFieldValueAsBoolean(field);
        } else {
            fieldValues[field.name] = getPropertyFieldValue(field);
        }
    });

    return fieldValues;
}

/**
 * Gets all content fields from a fields array
 * 
 * @param fields - Array of fields to filter
 * @returns Array of content fields (display = true)
 */
export function getContentFields(fields: IFieldWithTranslations[]): IFieldWithTranslations[] {
    return fields.filter(field => field.display);
}

/**
 * Gets all property fields from a fields array
 * 
 * @param fields - Array of fields to filter
 * @returns Array of property fields (display = false)
 */
export function getPropertyFields(fields: IFieldWithTranslations[]): IFieldWithTranslations[] {
    return fields.filter(field => !field.display);
}
