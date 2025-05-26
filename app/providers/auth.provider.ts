import { AuthBindings } from "@refinedev/core";
import { ILoginRequest, ILoginResponse } from "@/types/api/auth.type";
import { API_CONFIG } from "@/config/api.config";
import { apiClient } from '@/api/base.api';

export const authProvider: AuthBindings = {
    login: async ({ user, password }: ILoginRequest) => {
        try {
            const response = await apiClient.post<ILoginResponse>(
                API_CONFIG.ENDPOINTS.LOGIN,
                { user, password }
            );

            if (response.data.error) {
                return {
                    success: false,
                    error: {
                        message: response.data.error,
                        name: "Login Error"
                    }
                };
            }

            if (!response.data.logged_in) {
                return {
                    success: false,
                    error: {
                        message: "Login failed",
                        name: "Login Error"
                    }
                };
            }

            const { access_token, refresh_token, expires_in } = response.data.data;
            localStorage.setItem("access_token", access_token ?? "");
            localStorage.setItem("refresh_token", refresh_token ?? "");
            localStorage.setItem("expires_in", expires_in?.toString() ?? "");

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
            await apiClient.post(API_CONFIG.ENDPOINTS.LOGOUT);
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("expires_in");

            return {
                success: true,
                redirectTo: "/auth/login"
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: "Logout failed",
                    name: "Logout Error"
                }
            };
        }
    },

    check: async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            return {
                authenticated: false,
                error: {
                    message: "Please login to continue",
                    name: "Authentication Error"
                },
                logout: true,
                redirectTo: "/auth/login"
            };
        }

        try {
            // You can add a token validation request here if needed
            return {
                authenticated: true
            };
        } catch (error) {
            return {
                authenticated: false,
                error: {
                    message: "Invalid token",
                    name: "Authentication Error"
                },
                logout: true,
                redirectTo: "/auth/login"
            };
        }
    },

    getPermissions: async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            return null;
        }

        // You can implement permission fetching logic here
        return null;
    },

    getIdentity: async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            return null;
        }

        try {
            // You can implement user profile fetching logic here
            return {
                id: 1,
                name: "User",
                avatar: null
            };
        } catch (error) {
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
