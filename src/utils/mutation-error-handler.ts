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
    if (error?.response) {
        const status = error.response.status;
        
        // 204 No Content is a success status, not an error
        if (status === 204) {
            return {
                errorMessage: 'Operation completed successfully.',
                errorTitle: 'Success'
            };
        }
        
        const responseData = error.response.data;
        
        if (responseData?.error || responseData?.message) {
            errorMessage = responseData.error || responseData.message;
            
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
        } else {
            // No response data, use status-based messages
            if (status === 500) {
                errorTitle = 'Server Error';
                errorMessage = 'Internal server error occurred.';
            } else if (status === 400) {
                errorTitle = 'Bad Request';
                errorMessage = 'Invalid request data.';
            } else if (status === 403) {
                errorTitle = 'Access Denied';
                errorMessage = 'You do not have permission to perform this action.';
            } else if (status === 404) {
                errorTitle = 'Not Found';
                errorMessage = 'The requested resource was not found.';
            } else if (status >= 400) {
                errorMessage = `Request failed with status ${status}.`;
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

/**
 * Standardized notification helper for showing errors
 * @param error - The error object to parse and display
 * @param customTitle - Optional custom title to override parsed title
 * @param customMessage - Optional custom message to override parsed message
 * @param position - Notification position (default: 'top-center')
 * @param autoClose - Auto close delay in ms (default: 8000)
 */
export function showErrorNotification(
    error: any,
    customTitle?: string,
    customMessage?: string,
    position: 'top-center' | 'top-right' | 'bottom-center' = 'top-center',
    autoClose: number = 8000
) {
    const { errorMessage, errorTitle } = parseApiError(error);

    // Import notifications dynamically to avoid circular dependencies
    import('@mantine/notifications').then(({ notifications }) => {
        import('@tabler/icons-react').then(({ IconX }) => {
            import('react').then((React) => {
                notifications.show({
                    title: customTitle || errorTitle,
                    message: customMessage || errorMessage,
                    icon: React.createElement(IconX, { size: '1rem' }),
                    color: 'red',
                    autoClose,
                    position,
                });
            });
        });
    });
}

/**
 * Standardized notification helper for showing success messages
 * @param title - Success title
 * @param message - Success message
 * @param position - Notification position (default: 'top-center')
 * @param autoClose - Auto close delay in ms (default: 5000)
 */
export function showSuccessNotification(
    title: string,
    message: string,
    position: 'top-center' | 'top-right' | 'bottom-center' = 'top-center',
    autoClose: number = 5000
) {
    // Import notifications dynamically to avoid circular dependencies
    import('@mantine/notifications').then(({ notifications }) => {
        import('@tabler/icons-react').then(({ IconCheck }) => {
            import('react').then((React) => {
                notifications.show({
                    title,
                    message,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose,
                    position,
                });
            });
        });
    });
}

/**
 * Standardized error handling wrapper for async operations
 * @param operation - The async operation to wrap
 * @param options - Configuration options
 * @returns Promise that resolves with operation result or rejects with parsed error
 */
export async function withErrorHandling<T>(
    operation: () => Promise<T>,
    options: {
        operationType?: keyof typeof ERROR_MESSAGES;
        customTitle?: string;
        customMessage?: string;
        showNotification?: boolean;
        position?: 'top-center' | 'top-right' | 'bottom-center';
        autoClose?: number;
    } = {}
): Promise<T> {
    const {
        operationType,
        customTitle,
        customMessage,
        showNotification = true,
        position = 'top-center',
        autoClose = 8000
    } = options;

    try {
        return await operation();
    } catch (error) {
        if (showNotification) {
            showErrorNotification(error, customTitle, customMessage, position, autoClose);
        }
        throw error; // Re-throw for component-level error handling
    }
} 