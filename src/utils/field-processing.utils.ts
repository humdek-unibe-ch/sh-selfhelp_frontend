import { IPageField, IPageFieldTranslation } from '../types/common/pages.type';
import { IUpdatePageField } from '../types/requests/admin/update-page.types';
import { ILanguage } from '../types/responses/admin/languages.types';

export interface IFieldProcessingOptions {
    fields: IPageField[];
    formValues: Record<string, Record<number, string>>;
    languages: ILanguage[];
}

export interface IProcessedFieldResult {
    fieldEntries: IUpdatePageField[];
    contentFields: IPageField[];
    propertyFields: IPageField[];
}

/**
 * Determines if a field is a content field (translatable) or property field (system)
 * Content fields have translations for specific languages, property fields have translations with language_code "all"
 *
 * @param field - The field to check
 * @returns true if field is content (has language-specific translations), false if property
 */
export function isContentField(field: IPageField): boolean {
    // Check if field has translations for specific languages (not "all")
    const hasSpecificLanguageTranslations = field.translations?.some(t =>
        t.language_code && t.language_code !== 'all'
    ) ?? false;

    return hasSpecificLanguageTranslations;
}

/**
 * Determines if a field is a property field (system, non-translatable)
 * Property fields have translations with language_code "all" or no translations
 *
 * @param field - The field to check
 * @returns true if field is property (has "all" language translations or no translations), false if content
 */
export function isPropertyField(field: IPageField): boolean {
    // Check if field has translations with language_code "all" or no translations at all
    const hasAllLanguageTranslation = field.translations?.some(t =>
        t.language_code === 'all'
    ) ?? false;

    const hasNoTranslations = !field.translations || field.translations.length === 0;

    return hasAllLanguageTranslation || hasNoTranslations;
}

/**
 * Gets the appropriate language IDs for a field based on its translation type
 *
 * Content fields (language-specific translations): All available languages
 * Property fields ("all" language translations): Language ID 1 only
 *
 * @param field - The field to process
 * @param languages - Available languages
 * @returns Array of language IDs to process for this field
 */
export function getFieldLanguageIds(field: IPageField, languages: ILanguage[]): number[] {
    if (isContentField(field)) {
        // Content fields: all languages
        return languages.map(lang => lang.id);
    } else {
        // Property fields: language ID 1 only
        return [1];
    }
}

/**
 * Processes a single field according to its translation type rules
 *
 * @param field - The field to process
 * @param formValues - Form values structure: formValues[fieldName][languageId]
 * @param languages - Available languages
 * @returns Array of field entries for the API
 */
export function processField(
    field: IPageField,
    formValues: Record<string, Record<number, string>>,
    languages: ILanguage[]
): IUpdatePageField[] {
    const fieldEntries: IUpdatePageField[] = [];
    
    if (isPropertyField(field)) {
        // Property fields: Find content in any language but save with language ID 1
        let content = '';
        
        // Check all languages to find where the content is stored
        for (const lang of languages) {
            const langContent = formValues[field.name]?.[lang.id] || '';
            if (langContent.trim()) {
                content = langContent;
                break; // Use the first non-empty content found
            }
        }
        
        // If no content found in any language, check language ID 1 specifically
        if (!content.trim()) {
            content = formValues[field.name]?.[1] || '';
        }
        
        // Property fields: always save with language ID 1
        fieldEntries.push({
            fieldId: field.id,
            languageId: 1,
            content: content,
        });
    } else {
        // Content fields: process for all languages
        const languageIds = getFieldLanguageIds(field, languages);
        
        languageIds.forEach(languageId => {
            const content = formValues[field.name]?.[languageId] || '';
            
            // Content fields: always add for all languages
            fieldEntries.push({
                fieldId: field.id,
                languageId: languageId,
                content: content,
            });
        });
    }
    
    return fieldEntries;
}

/**
 * Processes all fields according to their display type rules
 * 
 * @param options - Field processing options
 * @returns Processed field results with categorized fields and API entries
 */
export function processAllFields(options: IFieldProcessingOptions): IProcessedFieldResult {
    const { fields, formValues, languages } = options;
    const fieldEntries: IUpdatePageField[] = [];
    const contentFields: IPageField[] = [];
    const propertyFields: IPageField[] = [];
    
    fields.forEach(field => {
        // Categorize fields
        if (isContentField(field)) {
            contentFields.push(field);
        } else {
            propertyFields.push(field);
        }
        
        // Process field entries
        const entries = processField(field, formValues, languages);
        fieldEntries.push(...entries);
    });
    
    return {
        fieldEntries,
        contentFields,
        propertyFields
    };
}

/**
 * Gets the display name for a field type
 *
 * @param field - The field to get display name for
 * @returns Human-readable field type description
 */
export function getFieldTypeDisplayName(field: IPageField): string {
    if (isContentField(field)) {
        return `Content Field (${field.type})`;
    } else {
        return `Property Field (${field.type})`;
    }
}

/**
 * Validates field processing rules
 *
 * @param field - The field to validate
 * @returns Validation result with any warnings or errors
 */
export function validateFieldProcessing(field: IPageField): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
} {
    const warnings: string[] = [];
    const errors: string[] = [];

    // CSS fields should typically be property fields
    if (field.type === 'css' && isContentField(field)) {
        warnings.push(`CSS field "${field.name}" has language-specific translations but might be better as a property field`);
    }

    // JSON fields are typically property fields
    if (field.type === 'json' && isContentField(field)) {
        warnings.push(`JSON field "${field.name}" has language-specific translations but might be better as a property field`);
    }

    return {
        isValid: errors.length === 0,
        warnings,
        errors
    };
}

/**
 * Initializes form values for fields, handling content vs property field loading correctly
 * Content fields populate based on language-specific translations
 * Property fields use "all" language translations or language_id = 1
 *
 * @param fields - Page fields from API
 * @param languages - Available languages
 * @returns Form values structure: Record<fieldName, Record<languageId, content>>
 */
export function initializeFieldFormValues(
    fields: IPageField[],
    languages: ILanguage[]
): Record<string, Record<number, string>> {
    const fieldsObject: Record<string, Record<number, string>> = {};

    // Initialize all fields with empty strings for all languages
    fields.forEach(field => {
        fieldsObject[field.name] = {};
        languages.forEach(language => {
            fieldsObject[field.name][language.id] = '';
        });
    });

    // Populate with actual field content from translations
    fields.forEach(field => {
        if (isContentField(field)) {
            // Content fields: populate based on actual language_id from translations
            field.translations.forEach((translation: IPageFieldTranslation) => {
                const language = languages.find(l => l.id === translation.language_id);
                if (language) {
                    fieldsObject[field.name][language.id] = translation.content || '';
                }
            });
        } else {
            // Property fields: find content from language_id = 1 and replicate across all languages
            const propertyTranslation = field.translations.find((t: IPageFieldTranslation) => t.language_id === 1);
            const propertyContent = propertyTranslation?.content || '';

            // Set the value for language_id = 1 (property language) for consistency
            fieldsObject[field.name][1] = propertyContent;

            // Also replicate to all available languages for editing convenience
            languages.forEach(language => {
                fieldsObject[field.name][language.id] = propertyContent;
            });
        }
    });

    return fieldsObject;
} 