/**
 * API client for handling authentication-related API calls.
 * Provides methods for user login, logout, token refresh operations, and two-factor authentication.
 * 
 * @module api/auth.api
 */

import { ILoginRequest, ILoginResponse, ILogoutResponse, IRefreshTokenResponse, ITwoFactorRequest, ITwoFactorResponse, ITwoFactorSetupResponse } from '@/types/api/auth.type';
import { apiClient } from './base.api';
import { API_CONFIG } from '@/config/api.config';
import { NavigationApi } from './navigation.api';

export const AuthApi = {
    /**
     * Authenticates a user with their credentials.
     * @param {ILoginRequest} credentials - User login credentials
     * @returns {Promise<ILoginResponse>} Response containing authentication tokens and user info or 2FA flag if 2FA is required
     * @throws {Error} When authentication fails
     */
    async login(credentials: ILoginRequest): Promise<ILoginResponse> {
        const response = await apiClient.post<ILoginResponse>(
            API_CONFIG.ENDPOINTS.LOGIN,
            credentials
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        // If not logged in and not requiring 2FA, it's a login failure
        if (!response.data.logged_in && !response.data.data.two_factor) {
            throw new Error('Login failed');
        }

        // If 2FA is required, return the response without storing tokens
        if (response.data.data.two_factor) {
            return response.data;
        }

        // Store tokens in localStorage if normal login flow
        if (response.data.data.access_token) {
            localStorage.setItem('access_token', response.data.data.access_token);
            localStorage.setItem('refresh_token', response.data.data.refresh_token || '');
            localStorage.setItem('expires_in', response.data.data.expires_in?.toString() || '0');
        }

        return response.data;
    },

    /**
     * Gets the two-factor authentication setup information.
     * @returns {Promise<ITwoFactorSetupResponse>} Response containing 2FA method and session
     * @throws {Error} When 2FA setup fails
     */
    async getTwoFactorSetup(): Promise<ITwoFactorSetupResponse> {
        const response = await apiClient.get<ITwoFactorSetupResponse>(
            API_CONFIG.ENDPOINTS.TWO_FACTOR_SETUP
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        return response.data;
    },

    /**
     * Verifies a two-factor authentication code.
     * @param {ITwoFactorRequest} twoFactorData - 2FA verification data including code and session
     * @returns {Promise<ITwoFactorResponse>} Response containing authentication tokens and redirect info
     * @throws {Error} When 2FA verification fails
     */
    async verifyTwoFactor(twoFactorData: ITwoFactorRequest): Promise<ITwoFactorResponse> {
        const response = await apiClient.post<ITwoFactorResponse>(
            API_CONFIG.ENDPOINTS.TWO_FACTOR_VERIFY,
            twoFactorData,
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        if (!response.data.logged_in) {
            throw new Error('Two-factor authentication failed');
        }

        // Store tokens in localStorage
        if (response.data.data?.access_token) {
            localStorage.setItem('access_token', response.data.data.access_token);
            localStorage.setItem('refresh_token', response.data.data.refresh_token);
            localStorage.setItem('expires_in', response.data.data.expires_in.toString());
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
