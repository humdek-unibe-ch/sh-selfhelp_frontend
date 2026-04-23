/**
 * Auth API client — browser-side only.
 *
 * After the full BFF migration, this module is a thin wrapper around the
 * Next.js `/api/auth/*` route handlers. Tokens are **never** stored in the
 * browser; they live in httpOnly cookies set by the proxy. The single
 * `['user-data']` React Query key (see `REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA`)
 * is the source of truth for "who is the current user", so SSR dehydration
 * and client hydration agree on the cache slot.
 *
 * @module api/auth.api
 */

import { permissionAwareApiClient } from './base.api';
import { ILoginRequest, ITwoFactorVerifyRequest } from '../types/requests/auth/auth.types';
import {
    ILoginSuccessResponse,
    ITwoFactorRequiredResponse,
    ITwoFactorVerifySuccessResponse,
    ILogoutSuccessResponse,
    ILanguagePreferenceUpdateResponse,
} from '../types/responses/auth.types';
import { IUserDataResponse } from '../types/auth/jwt-payload.types';
import { API_CONFIG } from '../config/api.config';

export const AuthApi = {
    /**
     * POST /api/auth/login — dedicated BFF route that sets httpOnly cookies
     * and returns the user payload without tokens.
     */
    async login(credentials: ILoginRequest): Promise<ILoginSuccessResponse | ITwoFactorRequiredResponse> {
        const response = await permissionAwareApiClient.post<ILoginSuccessResponse | ITwoFactorRequiredResponse>(
            API_CONFIG.ENDPOINTS.AUTH_LOGIN,
            credentials
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        if ('requires_2fa' in response.data.data) {
            return response.data as ITwoFactorRequiredResponse;
        }

        return response.data as ILoginSuccessResponse;
    },

    /**
     * POST /cms-api/v1/auth/two-factor-verify via the catch-all proxy. The
     * upstream returns an access token in `data.access_token`; the catch-all
     * automatically rotates cookies and strips the token from the body.
     */
    async verifyTwoFactor(twoFactorData: ITwoFactorVerifyRequest): Promise<ITwoFactorVerifySuccessResponse> {
        const response = await permissionAwareApiClient.post<ITwoFactorVerifySuccessResponse>(
            API_CONFIG.ENDPOINTS.TWO_FACTOR_VERIFY,
            twoFactorData
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        return response.data;
    },

    /**
     * POST /api/auth/logout — clears httpOnly cookies and notifies Symfony.
     */
    async logout(): Promise<ILogoutSuccessResponse> {
        const response = await permissionAwareApiClient.post<ILogoutSuccessResponse>(
            API_CONFIG.ENDPOINTS.AUTH_LOGOUT,
            {}
        );

        return response?.data || {
            status: 200,
            message: 'Logged out',
            error: null,
            logged_in: false,
            meta: { version: 'v1', timestamp: new Date().toISOString() },
            data: { message: 'Successfully logged out' },
        };
    },

    /**
     * POST /cms-api/v1/auth/set-language via the catch-all. Upstream returns a
     * new access token; the proxy rotates `sh_auth` automatically.
     */
    async updateLanguagePreference(languageId: number): Promise<ILanguagePreferenceUpdateResponse> {
        const response = await permissionAwareApiClient.post<ILanguagePreferenceUpdateResponse>(
            API_CONFIG.ENDPOINTS.AUTH_SET_LANGUAGE,
            { language_id: languageId }
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        return response.data;
    },

    async getUserData(): Promise<IUserDataResponse> {
        const response = await permissionAwareApiClient.get<IUserDataResponse>(
            API_CONFIG.ENDPOINTS.AUTH_USER_DATA
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        return response.data;
    },

    async updateUsername(newUsername: string): Promise<IUserDataResponse> {
        const response = await permissionAwareApiClient.put<IUserDataResponse>(
            API_CONFIG.ENDPOINTS.USER_UPDATE_USERNAME,
            { user_name: newUsername }
        );
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    },

    async updateName(newName: string): Promise<IUserDataResponse> {
        const response = await permissionAwareApiClient.put<IUserDataResponse>(
            API_CONFIG.ENDPOINTS.USER_UPDATE_NAME,
            { name: newName }
        );
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    },

    async updatePassword(
        currentPassword: string,
        newPassword: string
    ): Promise<{ status: number; message: string; error?: string }> {
        const response = await permissionAwareApiClient.put<{ status: number; message: string; error?: string }>(
            API_CONFIG.ENDPOINTS.USER_UPDATE_PASSWORD,
            { current_password: currentPassword, new_password: newPassword }
        );
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    },

    async deleteAccount(
        emailConfirmation: string
    ): Promise<{ status: number; message: string; error?: string }> {
        const response = await permissionAwareApiClient.delete<{ status: number; message: string; error?: string }>(
            API_CONFIG.ENDPOINTS.USER_DELETE_ACCOUNT,
            { data: { email_confirmation: emailConfirmation } }
        );
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    },

    async updateTimezone(timezoneId: number): Promise<IUserDataResponse> {
        const response = await permissionAwareApiClient.put<IUserDataResponse>(
            API_CONFIG.ENDPOINTS.USER_UPDATE_TIMEZONE,
            { timezone_id: timezoneId }
        );
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    },

    async validateToken(userId: number, token: string) {
        const response = await permissionAwareApiClient.get(
            API_CONFIG.ENDPOINTS.USER_VALIDATE_TOKEN,
            userId,
            token
        );
        return response.data;
    },

    async completeValidation(
        userId: number,
        token: string,
        data: {
            password: string;
            name?: string;
            section_id: number;
            form_inputs?: Record<string, any>;
        }
    ) {
        const response = await permissionAwareApiClient.post(
            API_CONFIG.ENDPOINTS.USER_COMPLETE_VALIDATION,
            data,
            userId,
            token
        );
        return response.data;
    },
};
