/**
 * API client for handling authentication-related API calls.
 * Provides methods for user login, logout, and token refresh operations.
 * 
 * @module api/auth.api
 */

import { ILoginRequest, ILoginResponse, ILogoutResponse, IRefreshTokenResponse } from '@/types/api/auth.type';
import { apiClient } from './base.api';
import { API_CONFIG } from '@/config/api.config';
import { NavigationApi } from './navigation.api';

export const AuthApi = {
    /**
     * Authenticates a user with their credentials.
     * @param {ILoginRequest} credentials - User login credentials
     * @returns {Promise<ILoginResponse>} Response containing authentication tokens and user info
     * @throws {Error} When authentication fails
     */
    async login(credentials: ILoginRequest): Promise<ILoginResponse> {
        const response = await apiClient.post<ILoginResponse>(
            API_CONFIG.ENDPOINTS.LOGIN,
            credentials
        );

        // Store tokens in localStorage
        if (response.data.data?.access_token) {
            localStorage.setItem('access_token', response.data.data.access_token);
            localStorage.setItem('refresh_token', response.data.data.refresh_token);
            localStorage.setItem('expires_in', response.data.data.expires_in.toString());
        }

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        if (!response.data.logged_in) {
            throw new Error('Login failed');
        }

        return response.data;
    },

    /**
     * Refreshes the authentication token using the refresh token.
     * @returns {Promise<IRefreshTokenResponse>} New access token and related data
     * @throws {Error} When refresh token is missing or invalid
     */
    async refreshToken(): Promise<IRefreshTokenResponse> {
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await apiClient.post<IRefreshTokenResponse>(
            API_CONFIG.ENDPOINTS.REFRESH_TOKEN,
            { refresh_token: refreshToken }
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        return response.data;
    },

    /**
     * Logs out the current user and invalidates their tokens.
     * @returns {Promise<ILogoutResponse>} Confirmation of successful logout
     * @throws {Error} When logout operation fails
     */
    async logout(): Promise<ILogoutResponse> {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        const response = await apiClient.post<ILogoutResponse>(
            API_CONFIG.ENDPOINTS.LOGOUT,
            {
                access_token: accessToken || undefined,
                refresh_token: refreshToken || undefined
            }
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        // Clear tokens from localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('expires_in');
        
        // Update navigation to reflect logged-out state
        try {
            await NavigationApi.getRoutes();
            return response.data;
        } catch (error) {
            console.warn('Failed to update navigation after logout:', error);
            return response.data;
        }
    }
};
