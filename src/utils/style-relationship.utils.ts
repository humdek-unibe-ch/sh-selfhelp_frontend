import { IStyle } from '../types/responses/admin/styles.types';

/**
 * Checks if a style is allowed as a child of a parent style based on relationships
 * @param childStyle - The style to check as a potential child
 * @param parentStyle - The parent style with relationships (can be null for page-level)
 * @returns true if the style is allowed as a child, false otherwise
 */
export function isStyleAllowedAsChildOfParent(childStyle: IStyle, parentStyle: IStyle | null): boolean {
    // If no parent style, allow all styles (adding to page)
    if (!parentStyle) {
        return true;
    }

    // If parent has no relationships defined, allow all styles (backward compatibility)
    if (!parentStyle.relationships) {
        return true;
    }

    // If parent's allowedChildren is empty, allow all styles
    if (parentStyle.relationships.allowedChildren.length === 0) {
        return true;
    }

    // Check if current style is in the parent's allowedChildren
    return parentStyle.relationships.allowedChildren.some(allowedChild =>
        allowedChild.id === childStyle.id
    );
}

/**
 * Checks if a child style is allowed to be added to a specific parent style
 * This checks both directions: parent's allowedChildren AND child's allowedParents
 * @param childStyle - The style to check as a potential child
 * @param parentStyle - The parent style (can be null for page-level)
 * @returns true if the relationship is allowed, false otherwise
 */
export function isStyleRelationshipValid(childStyle: IStyle, parentStyle: IStyle | null): boolean {
    // First check if the child is allowed as a child of the parent
    const isAllowedAsChild = isStyleAllowedAsChildOfParent(childStyle, parentStyle);

    // Then check if the child style has restrictions on which parents it can be added to
    if (childStyle.relationships && childStyle.relationships.allowedParents.length > 0) {
        // If the child has allowedParents restrictions and we have a parent
        if (parentStyle) {
            const isParentAllowed = childStyle.relationships.allowedParents.some(allowedParent =>
                allowedParent.id === parentStyle.id
            );
            return isAllowedAsChild && isParentAllowed;
        } else {
            // If the child has allowedParents restrictions but we're adding to page level
            // Only allow if the child style explicitly allows page-level (no parent)
            return false; // Child has parent restrictions but we're adding to page
        }
    }

    // If child has no parent restrictions, just return the child-of-parent check
    return isAllowedAsChild;
}

/**
 * Finds a style by ID from an array of style groups
 * @param styleId - The ID of the style to find
 * @param styleGroups - Array of style groups to search in
 * @returns The found style or null if not found
 */
export function findStyleById(styleId: number, styleGroups: Array<{ styles: IStyle[] }>): IStyle | null {
    for (const group of styleGroups) {
        const foundStyle = group.styles.find(style => style.id === styleId);
        if (foundStyle) {
            return foundStyle;
        }
    }
    return null;
}
