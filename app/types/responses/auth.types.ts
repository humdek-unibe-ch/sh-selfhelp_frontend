import { BaseApiResponse } from "./common/response-envelope.types";

// Common User interface for login and 2FA verify success
export interface User {
    id: number;
    email: string;
    name: string;
}

// Login Success
export interface LoginSuccessData {
    access_token: string;
    refresh_token: string;
    user: User;
}
export type LoginSuccessResponse = BaseApiResponse<LoginSuccessData>;

// 2FA Required
export interface TwoFactorRequiredData {
    message: string;
    id_users: number;
}
export type TwoFactorRequiredResponse = BaseApiResponse<TwoFactorRequiredData>;

// 2FA Verify Success
export interface TwoFactorVerifySuccessData {
    access_token: string;
    refresh_token: string;
    user: User;
}
export type TwoFactorVerifySuccessResponse = BaseApiResponse<TwoFactorVerifySuccessData>;

// Logout Success
export interface LogoutSuccessData {
    message: string;
}
export type LogoutSuccessResponse = BaseApiResponse<LogoutSuccessData>;

// Refresh Token Success
export interface RefreshTokenSuccessData {
    access_token: string;
    refresh_token: string;
}
export type RefreshTokenSuccessResponse = BaseApiResponse<RefreshTokenSuccessData>;
