/**
 * API client for handling authentication-related API calls.
 * Provides methods for user login, logout, token refresh operations, and two-factor authentication.
 * 
 * @module api/auth.api
 */

import { apiClient } from './base.api';
import { NavigationApi } from './navigation.api';
import { ILoginRequest, ILogoutRequest, IRefreshTokenRequest, ITwoFactorVerifyRequest } from '../types/requests/auth/auth.types';
import { ILoginSuccessResponse, ITwoFactorRequiredResponse, ITwoFactorVerifySuccessResponse, ILogoutSuccessResponse, TRefreshTokenSuccessResponse, ILanguagePreferenceUpdateResponse } from '../types/responses/auth.types';
import { storeTokens, removeTokens, getRefreshToken, getCurrentUser } from '../utils/auth.utils';
import { API_CONFIG } from '../config/api.config';

export const AuthApi = {
    /**
     * Clears all authentication data and updates navigation
     * @private
     */
    clearAuthData() {
        // Use the utility function to remove tokens
        removeTokens();
        
        // Remove other auth-related data
        localStorage.removeItem('user');
        localStorage.removeItem('pending_2fa_user_id');
        
        // Update navigation to reflect logged-out state
        try {
            NavigationApi.getPages();
        } catch (error) {
            console.warn('Failed to update navigation after clearing auth data:', error);
        }
    },
    /**
     * Authenticates a user with their credentials.
     * @param {ILoginRequest} credentials - User login credentials
     * @returns {Promise<ILoginSuccessResponse | ITwoFactorRequiredResponse>} Response containing authentication tokens and user info or 2FA flag if 2FA is required
     * @throws {Error} When authentication fails
     */
    async login(credentials: ILoginRequest): Promise<ILoginSuccessResponse | ITwoFactorRequiredResponse> {
        const response = await apiClient.post<ILoginSuccessResponse | ITwoFactorRequiredResponse>(
            API_CONFIG.ENDPOINTS.AUTH_LOGIN,
            credentials
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        // Check if 2FA is required
        if ('requires_2fa' in response.data.data) {
            return response.data as ITwoFactorRequiredResponse;
        }

        // Store tokens if normal login flow
        const loginData = response.data as ILoginSuccessResponse;
        if (loginData.data.access_token) {
            // Use the utility function to store tokens
            storeTokens(loginData.data.access_token, loginData.data.refresh_token);
            
            // Store user data
            localStorage.setItem('user', JSON.stringify(loginData.data.user));
        }

        return loginData;
    },

    /**
     * Verifies a two-factor authentication code.
     * @param {ITwoFactorVerifyRequest} twoFactorData - 2FA verification data including code and user ID
     * @returns {Promise<ITwoFactorVerifySuccessResponse>} Response containing authentication tokens and user info
     * @throws {Error} When 2FA verification fails
     */
    async verifyTwoFactor(twoFactorData: ITwoFactorVerifyRequest): Promise<ITwoFactorVerifySuccessResponse> {
        const response = await apiClient.post<ITwoFactorVerifySuccessResponse>(
            API_CONFIG.ENDPOINTS.TWO_FACTOR_VERIFY,
            twoFactorData,
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        // Store tokens and user info
        const { access_token, refresh_token, user } = response.data.data;
        if (access_token) {
            // Use the utility function to store tokens
            storeTokens(access_token, refresh_token);
            
            // Store user data
            localStorage.setItem('user', JSON.stringify(user));
        }

        return response.data;
    },

    /**
     * Refreshes the authentication token using the refresh token.
     * @returns {Promise<TRefreshTokenSuccessResponse>} New access token and refresh token
     * @throws {Error} When refresh token is missing or invalid
     */
    async refreshToken(): Promise<TRefreshTokenSuccessResponse> {
        const refreshToken = getRefreshToken();

        if (!refreshToken) {
            // Clear any existing tokens and update navigation
            this.clearAuthData();
            throw new Error('No refresh token available');
        }

        try {
            const response = await apiClient.post<TRefreshTokenSuccessResponse>(
                API_CONFIG.ENDPOINTS.AUTH_REFRESH_TOKEN,
                { refresh_token: refreshToken } as IRefreshTokenRequest
            );

            if (response.data.error) {
                // Clear tokens on error
                this.clearAuthData();
                throw new Error(response.data.error);
            }

            // Update stored tokens
            const { access_token, refresh_token } = response.data.data;
            if (access_token) {
                // Use the utility function to store tokens
                storeTokens(access_token, refresh_token);
            }
            
            return response.data;
        } catch (error: any) {
            // Clear tokens and update navigation regardless of error type
            this.clearAuthData();
            
            // Rethrow the error for the caller to handle
            throw error;
        }
    },

    /**
     * Logs out the current user and invalidates their tokens.
     * @returns {Promise<ILogoutSuccessResponse>} Confirmation of successful logout
     * @throws {Error} When logout operation fails
     */
    async logout(): Promise<ILogoutSuccessResponse> {
        const refreshToken = getRefreshToken();
        let response;

        try {
            response = await apiClient.post<ILogoutSuccessResponse>(
                API_CONFIG.ENDPOINTS.AUTH_LOGOUT,
                { refresh_token: refreshToken } as ILogoutRequest
            );

            if (response.data.error) {
                throw new Error(response.data.error);
            }
        } finally {
            // Always clear auth data, even if the server request fails
            this.clearAuthData();
        }

        return response?.data || { status: 200, message: 'Logged out', error: null, logged_in: false, meta: { version: 'v1', timestamp: new Date().toISOString() }, data: { message: 'Successfully logged out' } };
    },

    /**
     * Updates user's language preference and returns new JWT token
     * @param {number} languageId - The language ID to set
     * @returns {Promise<ILanguagePreferenceUpdateResponse>} Response containing new JWT token with updated language preference
     * @throws {Error} When language update fails
     */
    async updateLanguagePreference(languageId: number): Promise<ILanguagePreferenceUpdateResponse> {
        const response = await apiClient.post<ILanguagePreferenceUpdateResponse>(
            API_CONFIG.ENDPOINTS.USER_LANGUAGE_PREFERENCE,
            { language_id: languageId }
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        // Store new token if provided
        if (response.data.data.access_token) {
            // Get current user data to preserve other fields
            const currentUser = getCurrentUser();
            const refreshToken = getRefreshToken();
            
            // Store the new access token with existing refresh token
            storeTokens(response.data.data.access_token, refreshToken || '');
            
            // Update stored user data with new language information
            if (currentUser) {
                const updatedUser = {
                    ...currentUser,
                    languageId: response.data.data.language_id,
                    languageLocale: response.data.data.language_locale
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        }

        return response.data;
    }
};