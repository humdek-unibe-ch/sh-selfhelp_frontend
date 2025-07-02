/**
 * Validates if a name contains only allowed characters:
 * - Letters (a-z, A-Z)
 * - Numbers (0-9)
 * - Hyphens (-)
 * - Underscores (_)
 */
export function isValidName(name: string): boolean {
    const validNameRegex = /^[a-zA-Z0-9_-]+$/;
    return validNameRegex.test(name);
}

/**
 * Sanitizes a name by removing invalid characters
 * Keeps only letters, numbers, hyphens, and underscores
 */
export function sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Gets an error message for invalid names
 */
export function getNameValidationError(): string {
    return 'Name can only contain letters, numbers, hyphens (-), and underscores (_)';
}

/**
 * Validates and returns result with error message
 */
export function validateName(name: string): { isValid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
        return { isValid: false, error: 'Name is required' };
    }
    
    if (!isValidName(name)) {
        return { isValid: false, error: getNameValidationError() };
    }
    
    return { isValid: true };
}

/**
 * Validates validation code with naming conventions and maximum length
 */
export function validateValidationCode(code: string): { isValid: boolean; error?: string } {
    if (!code || code.trim().length === 0) {
        return { isValid: false, error: 'Validation code is required' };
    }
    
    if (code.length > 16) {
        return { isValid: false, error: 'Validation code cannot exceed 16 characters' };
    }
    
    if (!isValidName(code)) {
        return { isValid: false, error: getNameValidationError() };
    }
    
    return { isValid: true };
} 