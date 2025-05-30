import { AuthProvider } from "@refinedev/core";
import { ILoginRequest, ITwoFactorVerifyRequest } from "../types/requests/auth/auth.types";
import { AuthApi } from "../api/auth.api";
import { ITwoFactorRequiredResponse } from "../types/responses/auth.types";
import { ROUTES } from "../config/routes.config";
import { getAccessToken, getCurrentUser, storeTokens, removeTokens } from "../utils/auth.utils";

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
            await AuthApi.verifyTwoFactor(request);

            return {
                success: true,
                redirectTo: ROUTES.HOME
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

                return {
                    success: true,
                    redirectTo: ROUTES.HOME
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
                redirectTo: ROUTES.LOGIN
            };
        } catch (error: any) {
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
                logout: true,
                redirectTo: ROUTES.LOGIN,
            };
        }

        // Get user from token and check if it's valid
        const user = getCurrentUser();
        if (!user) {
            // Token is invalid or expired
            removeTokens();
            return {
                authenticated: false,
                error: {
                    message: "Session expired",
                    name: "Not authenticated",
                },
                logout: true,
                redirectTo: ROUTES.LOGIN,
            };
        }

        // We have a valid token and user, so we consider the user authenticated
        return {
            authenticated: true,
        };
    },

    getPermissions: async () => {
        const user = getCurrentUser();
        return user?.permissions || [];
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
        // Check if the error is an authentication error (401)
        if (error.response?.status === 401) {
            return {
                error: {
                    message: "Authentication failed. Please login again.",
                    name: "Auth Error"
                },
                logout: true,
                redirectTo: ROUTES.LOGIN
            };
        }

        return { error };
    }
};
