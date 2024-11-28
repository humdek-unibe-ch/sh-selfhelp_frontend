import { ILoginRequest, ILoginResponse, ILogoutResponse, IRefreshTokenResponse } from '@/types/api/auth.type';
import { apiClient } from './api.service';
import { API_CONFIG } from '@/config/api.config';

export const AuthService = {
    async login(credentials: ILoginRequest): Promise<ILoginResponse> {
        console.log(credentials);
        const response = await apiClient.post<ILoginResponse>(
            API_CONFIG.ENDPOINTS.LOGIN,
            credentials
        );
        return response.data;
    },

    async refreshToken(): Promise<IRefreshTokenResponse> {
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await apiClient.post<IRefreshTokenResponse>(
            API_CONFIG.ENDPOINTS.REFRESH_TOKEN,
            { refresh_token: refreshToken }
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        return response.data;
    },

    async logout(): Promise<ILogoutResponse> {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        const response = await apiClient.post<ILogoutResponse>(
            API_CONFIG.ENDPOINTS.LOGOUT,
            {
                access_token: accessToken || undefined,
                refresh_token: refreshToken || undefined
            }
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        return response.data;
    }
};
