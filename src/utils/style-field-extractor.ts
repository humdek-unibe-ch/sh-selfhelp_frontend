/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Helper function to extract field content from the new field structure
 * Handles both direct properties and nested fields object structure
 * 
 * @param style - The style object containing fields
 * @param fieldName - The name of the field to extract
 * @returns The field content as a string, or empty string if not found
 */
export const getFieldContent = (style: unknown, fieldName: string): string => {
    const s = style as Record<string, unknown>;

    // Check if it's a direct property with content
    const direct = s[fieldName];
    if (direct && typeof direct === 'object' && 'content' in direct) {
        return String((direct as { content?: unknown }).content || '');
    }

    // Check in fields object with new structure: fields.fieldName.languageCode.content
    const fields = s.fields as Record<string, Record<string, { content?: unknown } | undefined>> | undefined;
    if (fields && fields[fieldName]) {
        const fieldData = fields[fieldName];

        // Try 'all' first for non-translatable fields like CSS, level, img_src, etc.
        const all = fieldData.all;
        if (all && all.content !== undefined) {
            return String(all.content || '');
        }

        // Try 'en-GB' for translatable fields like title, alt, text_md, etc.
        const enGB = fieldData['en-GB'];
        if (enGB && enGB.content !== undefined) {
            return String(enGB.content || '');
        }

        // Try any available language code as fallback
        const firstLanguage = Object.keys(fieldData)[0];
        const firstData = firstLanguage ? fieldData[firstLanguage] : undefined;
        if (firstData && firstData.content !== undefined) {
            return String(firstData.content || '');
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
export const hasFieldValue = (style: unknown, fieldName: string, value: string = '1'): boolean => {
    return getFieldContent(style, fieldName) === value;
};

/**
 * Safely casts size values for Mantine components
 * @param sizeString - The size string from the style field
 * @returns A properly typed Mantine size value
 */
export function castMantineSize(sizeString: string | undefined): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
    const validSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    const size = sizeString || 'sm';
    return (validSizes as readonly string[]).includes(size) ? size as 'xs' | 'sm' | 'md' | 'lg' | 'xl' : 'sm';
}

/**
 * Safely casts radius values for Mantine components
 * @param radiusString - The radius string from the style field
 * @returns A properly typed Mantine radius value
 */
export function castMantineRadius(radiusString: string | undefined): 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
    const validRadii = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;
    const radius = radiusString || 'sm';
    return (validRadii as readonly string[]).includes(radius) ? radius as 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' : 'sm';
} 