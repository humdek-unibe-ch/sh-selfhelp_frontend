/**
 * Centralized error handling utility for React Query mutations.
 * Provides consistent error parsing and formatting across the application.
 * 
 * @module utils/mutation-error-handler
 */

export interface IParsedError {
    errorMessage: string;
    errorTitle: string;
}

/**
 * Parses API errors into consistent format for user display
 * @param error - The error object from API call or mutation
 * @returns Parsed error with title and message
 */
export function parseApiError(error: any): IParsedError {
    let errorMessage = 'Operation failed. Please try again.';
    let errorTitle = 'Operation Failed';
    
    // Handle Axios errors (most common)
    if (error?.response?.data) {
        const responseData = error.response.data;
        
        if (responseData.error || responseData.message) {
            errorMessage = responseData.error || responseData.message;
            
            const status = responseData.status || error.response.status;
            if (status === 500) {
                errorTitle = 'Server Error';
            } else if (status === 400 || status === 422) {
                errorTitle = 'Validation Error';
            } else if (status === 409) {
                errorTitle = 'Conflict Error';
            } else if (status === 403) {
                errorTitle = 'Access Denied';
            } else if (status === 404) {
                errorTitle = 'Not Found';
            }
        }
    }
    // Handle direct error objects
    else if (error?.status && (error.error || error.message)) {
        errorMessage = error.error || error.message;
        if (error.status === 500) {
            errorTitle = 'Server Error';
        } else if (error.status === 400 || error.status === 422) {
            errorTitle = 'Validation Error';
        } else if (error.status === 403) {
            errorTitle = 'Access Denied';
        } else if (error.status === 404) {
            errorTitle = 'Not Found';
        }
    }
    // Handle network errors
    else if (error?.message) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
            errorTitle = 'Network Error';
            errorMessage = 'Unable to connect to the server. Please check your connection.';
        } else if (error.message.includes('timeout')) {
            errorTitle = 'Request Timeout';
            errorMessage = 'The request took too long to complete. Please try again.';
        } else {
            errorMessage = error.message;
        }
    }
    
    return { errorMessage, errorTitle };
}

/**
 * Common error messages for different operation types
 */
export const ERROR_MESSAGES = {
    CREATE: {
        title: 'Creation Failed',
        message: 'Failed to create item. Please try again.',
    },
    UPDATE: {
        title: 'Update Failed', 
        message: 'Failed to update item. Please try again.',
    },
    DELETE: {
        title: 'Deletion Failed',
        message: 'Failed to delete item. Please try again.',
    },
    FETCH: {
        title: 'Loading Failed',
        message: 'Failed to load data. Please try again.',
    },
    NETWORK: {
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your connection.',
    },
    VALIDATION: {
        title: 'Validation Error',
        message: 'Please check your input and try again.',
    },
    PERMISSION: {
        title: 'Access Denied',
        message: 'You do not have permission to perform this action.',
    },
} as const;

/**
 * Gets appropriate error message based on operation type
 * @param operationType - The type of operation that failed
 * @param customMessage - Optional custom message to override default
 * @returns Error message object
 */
export function getOperationErrorMessage(
    operationType: keyof typeof ERROR_MESSAGES,
    customMessage?: string
): { title: string; message: string } {
    const defaultError = ERROR_MESSAGES[operationType];
    return {
        title: defaultError.title,
        message: customMessage || defaultError.message,
    };
} 