import { AxiosError } from 'axios';
import { ROUTES } from '@/config/routes.config';

/**
 * Type for API error response
 */
export interface IApiErrorResponse {
    status: number;
    message: string;
    error: string;
    logged_in: boolean;
    meta: {
        version: string;
        timestamp: string;
    };
    data: any;
}

/**
 * Handles API errors consistently across the application
 * 
 * @param error The error object from API call
 * @param options Configuration options for error handling
 * @returns Formatted error message
 */
export const handleApiError = (
    error: unknown, 
    options: {
        showNotification?: boolean;
        redirectOnPermissionDenied?: boolean;
    } = { 
        showNotification: true, 
        redirectOnPermissionDenied: true 
    }
): string => {
    // Default error message
    let errorMessage = 'An unexpected error occurred';
    
    // Handle Axios errors
    if (error instanceof AxiosError) {
        const status = error.response?.status;
        const responseData = error.response?.data as IApiErrorResponse | undefined;
        
        // Use error message from response if available
        if (responseData?.error) {
            errorMessage = responseData.error;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        // Handle specific status codes
        if (status === 403 && responseData?.logged_in === true) {
            errorMessage = 'You do not have permission to access this resource';
            
            // Redirect to no-access page if option is enabled and not already there
            if (options.redirectOnPermissionDenied && 
                typeof window !== 'undefined' && 
                !window.location.pathname.startsWith(ROUTES.NO_ACCESS)) {
                window.location.href = ROUTES.NO_ACCESS;
            }
        } else if (status === 401) {
            errorMessage = 'Authentication required';
            
            // The axios interceptor will handle redirecting to login
        }
        
        // Log the error for debugging
        console.error(`API Error (${status}):`, errorMessage, error.config?.url);
    } else if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Non-Axios Error:', error);
    } else {
        console.error('Unknown Error:', error);
    }
    
    // Show notification if enabled (can be implemented with a notification library)
    if (options.showNotification) {
        // This would integrate with your notification system
        // For example: notifications.show({ message: errorMessage, color: 'red' });
    }
    
    return errorMessage;
};
