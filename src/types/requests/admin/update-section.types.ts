/**
 * Request interface for updating an existing section
 * Based on backend JSON schema validation requirements
 */

/**
 * Content field update structure for translatable fields (display=1)
 */
export interface IUpdateSectionContentField {
    /** ID of the field to update */
    fieldId: number;
    
    /** ID of the language for the field content */
    languageId: number;
    
    /** Content value of the field */
    value: string | null;
}

/**
 * Property field update structure for non-translatable fields (display=0)
 */
export interface IUpdateSectionPropertyField {
    /** ID of the field to update */
    fieldId: number;
    
    /** Property value of the field */
    value: string | boolean | number | null;
}

/**
 * Global fields structure for section-level properties
 */
export interface IUpdateSectionGlobalFields {
    /** JavaScript/logic condition for section visibility */
    condition?: string | null;

    /** JSON configuration for section data handling */
    data_config?: string | null;

    /** Custom CSS styles for the section */
    css?: string | null;

    /** Mobile-specific CSS styles */
    css_mobile?: string | null;

    /** Debug mode flag */
    debug?: boolean;
}

/**
 * Main update section request structure
 * Matches backend JSON schema exactly
 */
export interface IUpdateSectionRequest {
    /** Optional section name update */
    sectionName?: string;

    /** List of content field translations to update (display=1 fields) */
    contentFields: IUpdateSectionContentField[];

    /** List of property field values to update (display=0 fields) */
    propertyFields: IUpdateSectionPropertyField[];

    /** Global section-level properties */
    globalFields?: IUpdateSectionGlobalFields;
}

/**
 * Variables for the section update mutation
 */
export interface IUpdateSectionMutationVariables {
    pageId: number;
    sectionId: number;
    sectionData: IUpdateSectionRequest;
}
