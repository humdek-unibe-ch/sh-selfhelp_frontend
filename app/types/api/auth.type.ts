export interface ILoginRequest {
    user: string;
    password: string;
}

export interface ILoginResponse {
    status: number;
    message: string;
    error: string | null;
    logged_in: boolean;
    meta: {
        version: string;
        timestamp: string;
    };
    data: {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
        token_type?: string;
        '2fa'?: boolean;
    };
}

export interface ILogoutResponse {
    status: number;
    message: string;
    error: string | null;
    logged_in: boolean;
    data: null;
}

export interface IRefreshTokenResponse {
    status: number;
    message: string;
    error: string | null;
    logged_in: boolean;
    data: {
        access_token: string;
        expires_in: number;
        token_type: string;
    };
}

export interface IAuthState {
    isAuthenticated: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    expiresIn: number | null;
    requiresTwoFactor: boolean;
    redirectPath: string | null;
}

export interface ITwoFactorRequest {
    code: string;
    session: string;
}

export interface ITwoFactorResponse {
    status: number;
    message: string;
    error: string | null;
    logged_in: boolean;
    meta: {
        version: string;
        timestamp: string;
    };
    data: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
        redirect_to?: string;
    };
}

export interface ITwoFactorSetupResponse {
    status: number;
    message: string;
    error: string | null;
    logged_in: boolean;
    meta: {
        version: string;
        timestamp: string;
    };
    data: {
        method: '2fa_app' | '2fa_sms' | '2fa_email';
        session: string;
        contact?: string; // Partially masked email or phone number for SMS/email methods
    };
}
