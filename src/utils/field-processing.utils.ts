import { IUpdatePageField } from '../types/requests/admin/update-page.types';
import { IPageField } from '../types/responses/admin/page-details.types';
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
 * 
 * @param field - The field to check
 * @returns true if field is content (display = 1), false if property (display = 0)
 */
export function isContentField(field: IPageField): boolean {
    return field.display === true;
}

/**
 * Determines if a field is a property field (system, non-translatable)
 * 
 * @param field - The field to check
 * @returns true if field is property (display = 0), false if content (display = 1)
 */
export function isPropertyField(field: IPageField): boolean {
    return field.display === false;
}

/**
 * Gets the appropriate language IDs for a field based on its display type
 * 
 * Content fields (display = 1): All available languages
 * Property fields (display = 0): Language ID 1 only
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
 * Processes a single field according to its display type rules
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
        
        // Debug logging for CSS fields to track content propagation
        if (field.type === 'css') {
            console.log(`[FieldProcessing] Processing CSS property field "${field.name}"`, {
                fieldId: field.id,
                languageId: 1, // Always save as language ID 1
                content: content,
                contentLength: content.length,
                formValuesForField: formValues[field.name],
                searchedLanguages: languages.map(l => ({
                    id: l.id,
                    content: formValues[field.name]?.[l.id] || '',
                    hasContent: !!(formValues[field.name]?.[l.id] || '').trim()
                }))
            });
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
    
    // CSS fields should always be property fields
    if (field.type === 'css' && isContentField(field)) {
        warnings.push(`CSS field "${field.name}" has display=1 but should be display=0 (property field)`);
    }
    
    // JSON fields are typically property fields
    if (field.type === 'json' && isContentField(field)) {
        warnings.push(`JSON field "${field.name}" has display=1 but might be better as display=0 (property field)`);
    }
    
    return {
        isValid: errors.length === 0,
        warnings,
        errors
    };
} 