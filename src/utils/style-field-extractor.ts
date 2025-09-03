/**
 * Helper function to extract field content from the new field structure
 * Handles both direct properties and nested fields object structure
 * 
 * @param style - The style object containing fields
 * @param fieldName - The name of the field to extract
 * @returns The field content as a string, or empty string if not found
 */
export const getFieldContent = (style: any, fieldName: string): string => {
    // Check if it's a direct property with content
    if (style[fieldName] && typeof style[fieldName] === 'object' && 'content' in style[fieldName]) {
        return String(style[fieldName].content || '');
    }
    
    // Check in fields object with new structure: fields.fieldName.languageCode.content
    if (style.fields && style.fields[fieldName]) {
        const fieldData = style.fields[fieldName];
        
        // Try 'all' first for non-translatable fields like CSS, level, img_src, etc.
        if (fieldData.all && fieldData.all.content !== undefined) {
            return String(fieldData.all.content || '');
        }
        
        // Try 'en-GB' for translatable fields like title, alt, text_md, etc.
        if (fieldData['en-GB'] && fieldData['en-GB'].content !== undefined) {
            return String(fieldData['en-GB'].content || '');
        }
        
        // Try any available language code as fallback
        const firstLanguage = Object.keys(fieldData)[0];
        if (firstLanguage && fieldData[firstLanguage] && fieldData[firstLanguage].content !== undefined) {
            return String(fieldData[firstLanguage].content || '');
        }
    }
    
    return '';
};

/**
 * Helper function to check if a field has a specific value (useful for boolean-like fields)
 * 
 * @param style - The style object containing fields
 * @param fieldName - The name of the field to check
 * @param value - The value to check against (default: '1')
 * @returns True if the field matches the value, false otherwise
 */
export const hasFieldValue = (style: any, fieldName: string, value: string = '1'): boolean => {
    return getFieldContent(style, fieldName) === value;
}; 