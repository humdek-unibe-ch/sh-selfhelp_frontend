export interface ILoginRequest {
    user: string;
    password: string;
}

export interface ILoginResponse {
    token: string;
    user: {
        id: number;
        email: string;
        name: string;
    };
}

export interface IAuthState {
    isAuthenticated: boolean;
    user: ILoginResponse['user'] | null;
    token: string | null;
}
