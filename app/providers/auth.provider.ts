import { AuthBindings } from "@refinedev/core";
import { ILoginRequest, ITwoFactorVerifyRequest } from "@/types/requests/auth/auth.types";
import { AuthApi } from "@/api/auth.api";
import { ITwoFactorRequiredResponse } from "@/types/responses/auth.types";

// This function sets up a listener for auth state changes from the API interceptor
// It will be called when the auth provider is initialized
let authStateChangeListener: ((event: Event) => void) | null = null;

/**
 * Sets up a listener for auth state changes from the API interceptor
 * This ensures that Refine's auth state stays in sync with the API's auth state
 */
const listenForAuthStateChanges = () => {
    // Remove any existing listener to prevent duplicates
    if (authStateChangeListener) {
        window.removeEventListener('authStateChange', authStateChangeListener);
    }
    
    // Create a new listener
    authStateChangeListener = (event: Event) => {
        const customEvent = event as CustomEvent<{ isAuthenticated: boolean }>;
        const isAuthenticated = customEvent.detail.isAuthenticated;
        
        // If the user is logged out, clear tokens from localStorage
        if (!isAuthenticated) {
            
            // Redirect to login if not already there
            if (typeof window !== 'undefined' && 
                window.location.pathname.startsWith('/admin') && 
                !window.location.pathname.startsWith('/auth/login') && 
                !window.location.pathname.includes('/auth/verify-2fa')) {
                window.location.href = '/auth/login';
            }
        }
    };
    
    // Add the listener to the window
    if (typeof window !== 'undefined') {
        window.addEventListener('authStateChange', authStateChangeListener);
    }
};

// Initialize the listener when this module is loaded
if (typeof window !== 'undefined') {
    listenForAuthStateChanges();
}

// Custom method for 2FA verification that can be used in components
export const verify2fa = async ({ code }: { code: string }) => {
    try {
        const userId = localStorage.getItem("pending_2fa_user_id");
        
        if (!userId) {
            return {
                success: false,
                error: {
                    message: "No pending 2FA verification",
                    name: "2FA Error"
                }
            };
        }
        
        const request: ITwoFactorVerifyRequest = {
            id_users: parseInt(userId),
            code
        };
        
        try {
            // Use AuthApi.verifyTwoFactor instead of direct API call
            const response = await AuthApi.verifyTwoFactor(request);
            
            // The localStorage operations are already handled in AuthApi.verifyTwoFactor
            // so we don't need to set tokens here
            
            return {
                success: true,
                redirectTo: "/"
            };
        } catch (apiError: any) {
            return {
                success: false,
                error: {
                    message: apiError.message || "2FA Verification Error",
                    name: "2FA Verification Error"
                }
            };
        }
    } catch (error: any) {
        return {
            success: false,
            error: {
                message: error.message || "2FA verification failed",
                name: "2FA Error"
            }
        };
    }
};

export const authProvider: AuthBindings = {
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
                        redirectTo: "/auth/verify-2fa"
                    };
                }

                // This is a successful login response
                // The localStorage operations are already handled in AuthApi.login
                // so we don't need to set tokens here

                return {
                    success: true,
                    redirectTo: "/"
                };
            } catch (apiError: any) {
                return {
                    success: false,
                    error: {
                        message: apiError.message || "Login failed",
                        name: "Login Error"
                    }
                };
            }
        } catch (error: any) {
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

            return {
                success: true,
                redirectTo: "/auth/login"
            };
        } catch (error: any) {
            // Even if server logout fails, we still want to clear local storage
            // and redirect to login - AuthApi.logout already handles this in its catch block
            // but we'll add an extra safety check here
            localStorage.removeItem("pending_2fa_user_id");
            
            return {
                success: true,
                redirectTo: "/auth/login"
            };
        }
    },

    check: async () => {
        const token = localStorage.getItem("access_token");
        const refreshToken = localStorage.getItem("refresh_token");
        const pending2fa = localStorage.getItem("pending_2fa_user_id");

        // If there's a pending 2FA verification, user is not fully authenticated
        if (pending2fa) {
            return {
                authenticated: false,
                error: {
                    message: "2FA verification required",
                    name: "Not fully authenticated",
                },
                redirectTo: "/auth/verify-2fa",
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
                logout: true,
                redirectTo: "/auth/login",
            };
        }

        // We have a token, so we consider the user authenticated
        // The global interceptor will handle token refresh if any API call returns logged_in: false
        return {
            authenticated: true,
        };
    },

    getPermissions: async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            return null;
        }

        // In a real implementation, you would either:
        // 1. Decode the JWT token to extract roles/permissions if they're included in the payload
        // 2. Make an API call to fetch the user's permissions
        
        try {
            // Example of decoding JWT payload (simplified)
            // This assumes the token is in the format: header.payload.signature
            const payload = token.split('.')[1];
            if (payload) {
                const decodedPayload = JSON.parse(atob(payload));
                if (decodedPayload.roles) {
                    return decodedPayload.roles;
                }
            }
            
            // If roles aren't in the token, you might fetch them from an API
            // const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER_PERMISSIONS);
            // return response.data.data.permissions;
            
            // Fallback to default permissions
            return ["user"];
        } catch (error) {
            console.error("Failed to get permissions", error);
            return ["user"];
        }
    },

    getIdentity: async () => {
        const token = localStorage.getItem("access_token");
        const userJson = localStorage.getItem("user");
        
        if (!token) {
            return null;
        }

        // If we have user data in localStorage, use it
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                };
            } catch (error) {
                console.error("Failed to parse user data", error);
            }
        }
        
        // If we don't have user data or parsing failed, attempt to refresh the token
        // This will also update the user data in localStorage if successful
        try {
            // Use AuthApi.refreshToken instead of direct API call
            await AuthApi.refreshToken();
            
            // Try to get user data again after token refresh
            const updatedUserJson = localStorage.getItem("user");
            if (updatedUserJson) {
                const user = JSON.parse(updatedUserJson);
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                };
            }
            
            // For now, return a placeholder if we can't get the actual user data
            return {
                id: 1,
                name: "User",
                email: "user@example.com",
            };
        } catch (error) {
            // If token refresh fails, AuthApi.refreshToken should have already cleared the tokens
            // but we'll add an extra safety check here
            localStorage.removeItem("user");
            return null;
        }
    },


    
    onError: async (error) => {
        console.error(error);
        
        // Check if the error is an authentication error (401)
        if (error.response?.status === 401) {
            return {
                error: {
                    message: "Authentication failed. Please login again.",
                    name: "Auth Error"
                },
                logout: true,
                redirectTo: "/auth/login"
            };
        }

        return { error };
    }
};
