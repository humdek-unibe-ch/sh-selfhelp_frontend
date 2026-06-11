/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface ILoginRequest {
    email: string; // User's email address.
    password: string; // User's password.
}

export interface ILogoutRequest {
    refresh_token?: string; // The refresh token to be invalidated.
}

export interface IRefreshTokenRequest {
    refresh_token: string; // The refresh token used to obtain a new access token.
}

export interface ITwoFactorVerifyRequest {
    id_users: number; // The ID of the user attempting to verify 2FA.
    code: string; // The 6-digit 2FA code (pattern: "^[0-9]{6}$").
}

/**
 * Request interface for updating user language preference
 */
export interface IUpdateLanguagePreferenceRequest {
    language_id: number;
}

export interface IRegisterRequest {
    page_id: number; // ID of the CMS register page (locates the register section + policy).
    email: string; // The new user's email address.
    code?: string; // Validation code; required only when open_registration !== '1' (ignored server-side in open mode).
}