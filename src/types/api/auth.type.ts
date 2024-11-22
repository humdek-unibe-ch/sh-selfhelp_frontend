export interface ILoginRequest {
    user: string;
    password: string;
}

export interface ILoginResponse {
    status: number;
    message: string;
    error: string | null;
    logged_in: boolean;
    data: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
    };
}

export interface ILogoutResponse {
    status: number;
    message: string;
    error: string | null;
    logged_in: boolean;
    data: null;
}

export interface IAuthState {
    isAuthenticated: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    expiresIn: number | null;
}
