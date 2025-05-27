import { AuthBindings } from "@refinedev/core";
import { API_CONFIG } from "@/config/api.config";
import { apiClient } from '@/api/base.api';
import { ILoginRequest, ILogoutRequest, IRefreshTokenRequest, ITwoFactorVerifyRequest } from "@/types/requests/auth/auth.types";
import { IBaseApiErrorResponse } from "@/types/responses/common/error-response-envelope.types";
import { 
    ILoginSuccessResponse, 
    ITwoFactorRequiredResponse, 
    ITwoFactorVerifySuccessResponse, 
    ILogoutSuccessResponse, 
    TRefreshTokenSuccessResponse 
} from "@/types/responses/auth.types";

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
        
        const response = await apiClient.post<ITwoFactorVerifySuccessResponse | IBaseApiErrorResponse>(
            API_CONFIG.ENDPOINTS.TWO_FACTOR_VERIFY,
            request
        );
        
        if (response.data.error) {
            return {
                success: false,
                error: {
                    message: response.data.error,
                    name: "2FA Verification Error"
                }
            };
        }
        
        // This is a successful 2FA verification
        const verifyData = response.data as ITwoFactorVerifySuccessResponse;
        const { access_token, refresh_token, user } = verifyData.data || {};
        
        // Store tokens and user info
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.removeItem("pending_2fa_user_id");
        
        return {
            success: true,
            redirectTo: "/"
        };
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
            const response = await apiClient.post<ILoginSuccessResponse | ITwoFactorRequiredResponse | IBaseApiErrorResponse>(
                API_CONFIG.ENDPOINTS.LOGIN,
                { email, password }
            );
            
            // Check for error response
            if (response.data.error) {
                return {
                    success: false,
                    error: {
                        message: response.data.error,
                        name: "Login Error"
                    }
                };
            }

            // Check if 2FA is required
            if (response.data.data && 'id_users' in response.data.data) {
                // This is a 2FA required response
                const twoFactorData = response.data as ITwoFactorRequiredResponse;
                
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
            const loginData = response.data as ILoginSuccessResponse;
            const { access_token, refresh_token, user } = loginData.data || {};
            // Fix for TypeScript error: Object is possibly 'undefined'
            
            // Store tokens and user info
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("refresh_token", refresh_token);
            localStorage.setItem("user", JSON.stringify(user));

            return {
                success: true,
                redirectTo: "/"
            };
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
            const refreshToken = localStorage.getItem("refresh_token");
            
            if (refreshToken) {
                // Attempt to logout on the server
                await apiClient.post<ILogoutSuccessResponse>(
                    API_CONFIG.ENDPOINTS.LOGOUT,
                    { refresh_token: refreshToken } as ILogoutRequest
                );
            }

            // Clear all auth-related data from localStorage
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
            localStorage.removeItem("pending_2fa_user_id");

            return {
                success: true,
                redirectTo: "/auth/login"
            };
        } catch (error: any) {
            // Even if server logout fails, we still want to clear local storage
            // and redirect to login
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
            localStorage.removeItem("pending_2fa_user_id");
            
            return {
                success: true,
                redirectTo: "/auth/login"
            };
        }
    },

    check: async () => {
        const token = localStorage.getItem("access_token");
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

        if (!token) {
            return {
                authenticated: false,
                error: {
                    message: "Check failed",
                    name: "Not authenticated",
                },
                logout: true,
                redirectTo: "/auth/login",
            };
        }

        try {
            // Optional: Verify token validity with the server
            // This could be a lightweight endpoint that just validates the token
            // const response = await apiClient.get(API_CONFIG.ENDPOINTS.VERIFY_TOKEN);
            
            return {
                authenticated: true,
            };
        } catch (error) {
            // If token verification fails, attempt to refresh the token
            try {
                await this.getIdentity?.();
                return { authenticated: true };
            } catch (refreshError) {
                return {
                    authenticated: false,
                    error: {
                        message: "Session expired",
                        name: "Not authenticated",
                    },
                    logout: true,
                    redirectTo: "/auth/login",
                };
            }
        }
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
            const refreshToken = localStorage.getItem("refresh_token");
            if (!refreshToken) {
                throw new Error("No refresh token available");
            }
            
            const response = await apiClient.post<TRefreshTokenSuccessResponse>(
                API_CONFIG.ENDPOINTS.REFRESH_TOKEN,
                { refresh_token: refreshToken } as IRefreshTokenRequest
            );
            
            if (response.data.error) {
                throw new Error(response.data.error);
            }
            
            const { access_token, refresh_token } = response.data.data;
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("refresh_token", refresh_token);
            
            // After successful token refresh, we might need to fetch user data
            // if it's not included in the refresh token response
            // This would be an additional API call to get user profile
            
            // For now, return a placeholder if we can't get the actual user data
            return {
                id: 1,
                name: "User",
                email: "user@example.com",
            };
        } catch (error) {
            // If token refresh fails, clear auth data and return null
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
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
