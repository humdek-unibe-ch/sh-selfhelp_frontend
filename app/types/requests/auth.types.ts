export interface LoginRequest {
    email: string; // User's email address.
    password: string; // User's password.
}

export interface LogoutRequest {
    refresh_token?: string; // The refresh token to be invalidated.
}

export interface RefreshTokenRequest {
    refresh_token: string; // The refresh token used to obtain a new access token.
}

export interface TwoFactorVerifyRequest {
    id_users: number; // The ID of the user attempting to verify 2FA.
    code: string; // The 6-digit 2FA code (pattern: "^[0-9]{6}$").
}