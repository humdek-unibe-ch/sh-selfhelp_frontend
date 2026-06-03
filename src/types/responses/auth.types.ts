/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { IBaseApiResponse } from "./common/response-envelope.types";

// Common User interface for login and 2FA verify success
export interface IUser {
    id: number;
    email: string;
    name: string;
    /** User's preferred language ID */
    language_id?: number;
    /** User's preferred language locale */
    language_locale?: string;
}

// Login Success
export interface ILoginSuccessData {
    access_token: string;
    refresh_token: string;
    user: IUser;
}
export type ILoginSuccessResponse = IBaseApiResponse<ILoginSuccessData>;

// 2FA Required
export interface ITwoFactorRequiredData {
    requires_2fa: boolean;
    id_users: number;
}
export type ITwoFactorRequiredResponse = IBaseApiResponse<ITwoFactorRequiredData>;

// 2FA Verify Success
export interface ITwoFactorVerifySuccessData {
    access_token: string;
    refresh_token: string;
    user: IUser;
}
export type ITwoFactorVerifySuccessResponse = IBaseApiResponse<ITwoFactorVerifySuccessData>;

// Logout Success
export interface ILogoutSuccessData {
    message: string;
}
export type ILogoutSuccessResponse = IBaseApiResponse<ILogoutSuccessData>;

// Registration Success — the public /auth/register endpoint returns only a
// confirmation flag (the new account is blocked until the user validates their
// email), matching the backend `responses/auth/register` schema.
export interface IRegisterSuccessData {
    registered: boolean;
}
export type IRegisterSuccessResponse = IBaseApiResponse<IRegisterSuccessData>;

// Language Preference Update Success
export interface ILanguagePreferenceUpdateData {
    message: string;
    language_id: number;
    language_locale: string;
    language_name: string;
    access_token: string;
}
export type ILanguagePreferenceUpdateResponse = IBaseApiResponse<ILanguagePreferenceUpdateData>;
