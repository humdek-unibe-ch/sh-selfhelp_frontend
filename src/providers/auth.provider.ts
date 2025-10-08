/**
 * Authentication provider for Refine.
 * Handles user authentication, authorization, and session management.
 * 
 * @module providers/auth.provider
 */

import { AuthProvider } from "@refinedev/core";
import { ILoginRequest, ITwoFactorVerifyRequest } from "../types/requests/auth/auth.types";
import { AuthApi } from "../api/auth.api";
import { ITwoFactorRequiredResponse } from "../types/responses/auth.types";
import { ROUTES } from "../config/routes.config";
import { getAccessToken, getCurrentUser, storeTokens, removeTokens, removeAccessToken, getRefreshToken } from "../utils/auth.utils";
import { info, warn, error } from '../utils/debug-logger';

// Custom method for 2FA verification that can be used in components
export const verifyTwoFactor = async (code: string) => {
    const pendingUserId = localStorage.getItem("pending_2fa_user_id");
    
    if (!pendingUserId) {
        throw new Error("No pending 2FA verification found");
    }

    try {
        const response = await AuthApi.verifyTwoFactor({
            code,
            id_users: parseInt(pendingUserId)
        });

        // Clear the pending 2FA data
        localStorage.removeItem("pending_2fa_user_id");

        return response;
    } catch (error) {
        throw error;
    }
};

export const authProvider: AuthProvider = {
    login: async ({ email, password }: ILoginRequest) => {
        try {
            
            try {
                // Use AuthApi.login instead of direct API call
                const response = await AuthApi.login({ email, password });
            
                // Check if 2FA is required based on response type
                if ('requires_2fa' in response.data) {
                    // This is a 2FA required response
                    const twoFactorData = response as ITwoFactorRequiredResponse;
                
                    // Store the user ID for the 2FA verification step
                    localStorage.setItem("pending_2fa_user_id", twoFactorData.data.id_users.toString());

                    return {
                        success: false,
                        error: {
                            message: "Two-factor authentication required",
                            name: "2FA Required"
                        },
                        // Custom property to indicate 2FA is needed
                        // This can be used by the UI to redirect to the 2FA page
                        redirectTo: ROUTES.VERIFY_2FA
                    };
                }

                // This is a successful login response
                // The localStorage operations are already handled in AuthApi.login
                // so we don't need to set tokens here
                info('Login successful', 'AuthProvider');
                
                // Redirect to home after login
                const redirectTo = ROUTES.HOME;
                
                return {
                    success: true,
                    redirectTo
                };
            } catch (apiError: any) {
                error('Login API error', 'AuthProvider', apiError);
                return {
                    success: false,
                    error: {
                        message: apiError.message || "Login failed",
                        name: "Login Error"
                    }
                };
            }
        } catch (error: any) {
            error('Login error', 'AuthProvider', error);
            return {
                success: false,
                error: {
                    message: error.message || "Login failed",
                    name: "Login Error"
                }
            };
        }
    },

    logout: async () => {
        try {
            
            // Use AuthApi.logout instead of direct API call
            // This will handle the API call and localStorage cleanup
            await AuthApi.logout();

            // Ensure pending 2FA data is also cleared (in case it's not handled in AuthApi)
            localStorage.removeItem("pending_2fa_user_id");
            
            info('Logout successful', 'AuthProvider');

            return {
                success: true,
                redirectTo: ROUTES.LOGIN
            };
        } catch (error: any) {
            warn('Logout error', 'AuthProvider', error);
            // Even if server logout fails, we still want to clear local storage
            // and redirect to login - AuthApi.logout already handles this in its catch block
            // but we'll add an extra safety check here
            localStorage.removeItem("pending_2fa_user_id");

            return {
                success: true,
                redirectTo: ROUTES.LOGIN
            };
        }
    },

    check: async () => {
        const token = getAccessToken();
        const pending2fa = localStorage.getItem("pending_2fa_user_id");
        
        // If there's a pending 2FA verification, user is not fully authenticated
        if (pending2fa) {
            return {
                authenticated: false,
                error: {
                    message: "2FA verification required",
                    name: "Not fully authenticated",
                },
                redirectTo: ROUTES.VERIFY_2FA,
            };
        }

        // No tokens means not authenticated
        if (!token) {
            return {
                authenticated: false,
                error: {
                    message: "Not authenticated",
                    name: "Not authenticated",
                },
                // Don't automatically logout/redirect - let the app handle navigation
                // This prevents unwanted redirects when tokens are cleared due to API errors
                // logout: true,
                // redirectTo: ROUTES.LOGIN,
            };
        }
        
        // Get user from token and check if it's valid
        const user = getCurrentUser();
        if (!user) {
            // Token is invalid or expired
            removeAccessToken();
            return {
                authenticated: false,
                error: {
                    message: "Session expired",
                    name: "Not authenticated",
                },
                // Don't automatically logout/redirect - let the app handle navigation
                // This prevents unwanted redirects when tokens expire due to API errors
                // logout: true,
                // redirectTo: ROUTES.LOGIN,
            };
        }

        // We have a valid token and user, so we consider the user authenticated
        return {
            authenticated: true,
        };
    },

    getIdentity: async () => {
        const user = getCurrentUser();
        const token = getAccessToken();
        
        if (!user) return null;
        
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            token: token || undefined,
        };
    },

    onError: async (error) => {
        // Only logout for clear authentication failures that can't be resolved
        // The base API interceptor handles token refresh for 401 errors automatically
        // This onError should only handle non-recoverable auth errors

        // Check if it's a 401 that wasn't already handled by token refresh
        // (indicated by the error not having a _retry flag set by the interceptor)
        if (error.response?.status === 401 && !error.config?._retry) {
            // This is likely a fresh 401 that should be handled by token refresh first
            // Don't logout immediately, let the interceptor handle it
            return { error };
        }

        // For other auth-related errors (403, etc.) or repeated 401s, don't auto-logout
        // Let the user see the error and decide what to do

        return { error };
    },
};

/**
 * Helper function to check if user is authenticated for frontend pages
 * This is more lenient than Refine's check and allows logged_in: false
 */
export const checkFrontendAuth = async (): Promise<{
    isAuthenticated: boolean;
    user?: any;
    shouldRefresh?: boolean;
}> => {
    const token = getAccessToken();
    
    if (!token) {
        return { isAuthenticated: false };
    }

    const user = getCurrentUser();
    if (!user) {
        return { 
            isAuthenticated: false,
            shouldRefresh: !!getRefreshToken()
        };
    }

    return {
        isAuthenticated: true,
        user,
        shouldRefresh: false
    };
};

/**
 * Helper function to force token refresh
 * Can be called manually when needed
 */
export const forceTokenRefresh = async (): Promise<boolean> => {
    try {
        
        const response = await AuthApi.refreshToken();
        
        if (response.data.access_token) {
            info('Manual token refresh successful', 'AuthProvider');
            return true;
        }
        
        return false;
    } catch (refreshError) {
        error('Manual token refresh failed', 'AuthProvider', refreshError);
        return false;
    }
};
