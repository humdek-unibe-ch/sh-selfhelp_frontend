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

// Refresh Token Success
export interface IRefreshTokenSuccessData {
    access_token: string;
    refresh_token: string;
}
export type TRefreshTokenSuccessResponse = IBaseApiResponse<IRefreshTokenSuccessData>;
