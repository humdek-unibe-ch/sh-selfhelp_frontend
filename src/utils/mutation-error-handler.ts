/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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

/** Per-item error detail returned inside a bulk-operation response. */
interface IApiErrorItem {
    sectionId?: string | number;
    id?: string | number;
    error?: string;
}

/** Structural view of the error shapes {@link parseApiError} understands. */
interface IApiErrorShape {
    response?: {
        status?: number;
        data?: {
            error?: string;
            message?: string;
            data?: { errors?: IApiErrorItem[] };
        };
    };
    status?: number;
    error?: string;
    message?: string;
}

/**
 * Parses API errors into consistent format for user display
 * @param error - The error object from API call or mutation
 * @returns Parsed error with title and message
 */
export function parseApiError(error: unknown): IParsedError {
    const err = error as IApiErrorShape | null | undefined;
    let errorMessage = 'Operation failed. Please try again.';
    let errorTitle = 'Operation Failed';
    
    // Handle Axios errors (most common)
    if (err?.response) {
        const status = err.response.status;
        
        // 204 No Content is a success status, not an error
        if (status === 204) {
            return {
                errorMessage: 'Operation completed successfully.',
                errorTitle: 'Success'
            };
        }
        
        const responseData = err.response.data;
        
        if (responseData?.error || responseData?.message) {
            errorMessage = responseData.error || responseData.message || errorMessage;

            const itemErrors = responseData?.data?.errors;
            if (Array.isArray(itemErrors) && itemErrors.length > 0) {
                const details = itemErrors
                    .slice(0, 5)
                    .map((item) => `#${item.sectionId ?? item.id}: ${item.error ?? 'Failed'}`)
                    .join('; ');
                const suffix = itemErrors.length > 5 ? `; +${itemErrors.length - 5} more` : '';
                errorMessage = `${errorMessage}: ${details}${suffix}`;
            }
            
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
            } else if (status !== undefined && status >= 400) {
                errorMessage = `Request failed with status ${status}.`;
            }
        }
    }
    // Handle direct error objects
    else if (err?.status && (err.error || err.message)) {
        errorMessage = err.error || err.message || errorMessage;
        if (err.status === 500) {
            errorTitle = 'Server Error';
        } else if (err.status === 400 || err.status === 422) {
            errorTitle = 'Validation Error';
        } else if (err.status === 403) {
            errorTitle = 'Access Denied';
        } else if (err.status === 404) {
            errorTitle = 'Not Found';
        }
    }
    // Handle network errors
    else if (err?.message) {
        if (err.message.includes('fetch') || err.message.includes('network')) {
            errorTitle = 'Network Error';
            errorMessage = 'Unable to connect to the server. Please check your connection.';
        } else if (err.message.includes('timeout')) {
            errorTitle = 'Request Timeout';
            errorMessage = 'The request took too long to complete. Please try again.';
        } else {
            errorMessage = err.message;
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
    error: unknown,
    customTitle?: string,
    customMessage?: string,
    position: 'top-center' | 'top-right' | 'bottom-center' = 'top-center',
    autoClose: number = 8000
) {
    const { errorMessage, errorTitle } = parseApiError(error);

    // Import notifications dynamically to avoid circular dependencies
    void import('@mantine/notifications').then(({ notifications }) => {
        void import('@tabler/icons-react').then(({ IconX }) => {
            void import('react').then((React) => {
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
    void import('@mantine/notifications').then(({ notifications }) => {
        void import('@tabler/icons-react').then(({ IconCheck }) => {
            void import('react').then((React) => {
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
