/**
 * API client for handling authentication-related API calls.
 * Provides methods for user login, logout, token refresh operations, and two-factor authentication.
 * 
 * @module api/auth.api
 */

import { apiClient } from './base.api';
import { API_CONFIG } from '@/config/api.config';
import { NavigationApi } from './navigation.api';
import { ILoginRequest, ILogoutRequest, IRefreshTokenRequest, ITwoFactorVerifyRequest } from '@/types/requests/auth/auth.types';
import { ILoginSuccessResponse, ITwoFactorRequiredResponse, ITwoFactorVerifySuccessResponse, ILogoutSuccessResponse, TRefreshTokenSuccessResponse } from '@/types/responses/auth.types';

export const AuthApi = {
    /**
     * Authenticates a user with their credentials.
     * @param {ILoginRequest} credentials - User login credentials
     * @returns {Promise<ILoginSuccessResponse | ITwoFactorRequiredResponse>} Response containing authentication tokens and user info or 2FA flag if 2FA is required
     * @throws {Error} When authentication fails
     */
    async login(credentials: ILoginRequest): Promise<ILoginSuccessResponse | ITwoFactorRequiredResponse> {
        const response = await apiClient.post<ILoginSuccessResponse | ITwoFactorRequiredResponse>(
            API_CONFIG.ENDPOINTS.LOGIN,
            credentials
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        // Check if 2FA is required
        if ('id_users' in response.data.data) {
            return response.data as ITwoFactorRequiredResponse;
        }

        // Store tokens in localStorage if normal login flow
        const loginData = response.data as ILoginSuccessResponse;
        if (loginData.data.access_token) {
            localStorage.setItem('access_token', loginData.data.access_token);
            localStorage.setItem('refresh_token', loginData.data.refresh_token);
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

        // Store tokens and user info in localStorage
        const { access_token, refresh_token, user } = response.data.data;
        if (access_token) {
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
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
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await apiClient.post<TRefreshTokenSuccessResponse>(
            API_CONFIG.ENDPOINTS.REFRESH_TOKEN,
            { refresh_token: refreshToken } as IRefreshTokenRequest
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        // Update stored tokens
        const { access_token, refresh_token } = response.data.data;
        if (access_token) {
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
        }

        return response.data;
    },

    /**
     * Logs out the current user and invalidates their tokens.
     * @returns {Promise<ILogoutSuccessResponse>} Confirmation of successful logout
     * @throws {Error} When logout operation fails
     */
    async logout(): Promise<ILogoutSuccessResponse> {
        const refreshToken = localStorage.getItem('refresh_token');
        let response;

        try {
            response = await apiClient.post<ILogoutSuccessResponse>(
                API_CONFIG.ENDPOINTS.LOGOUT,
                { refresh_token: refreshToken } as ILogoutRequest
            );

            if (response.data.error) {
                throw new Error(response.data.error);
            }
        } finally {
            // Always clear local storage, even if the server request fails
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            localStorage.removeItem('pending_2fa_user_id');

            // Update navigation to reflect logged-out state
            try {
                await NavigationApi.getPages();
            } catch (error) {
                console.warn('Failed to update navigation after logout:', error);
            }
        }

        return response?.data || { status: 200, message: 'Logged out', error: null, logged_in: false, meta: { version: 'v1', timestamp: new Date().toISOString() }, data: { message: 'Successfully logged out' } };
    }
};