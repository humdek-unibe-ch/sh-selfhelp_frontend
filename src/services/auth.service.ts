import { ILoginRequest, ILoginResponse, ILogoutResponse, IRefreshTokenResponse } from '@/types/api/auth.type';
import { apiClient } from './api.service';
import { API_CONFIG } from '@/config/api.config';

export const AuthService = {
    async login(credentials: ILoginRequest): Promise<ILoginResponse> {
        const formData = new URLSearchParams();
        formData.append('user', credentials.user);
        formData.append('password', credentials.password);

        const response = await apiClient.post<ILoginResponse>(
            API_CONFIG.ENDPOINTS.LOGIN,
            formData.toString()
        );
        return response.data;
    },

    async refreshToken(): Promise<IRefreshTokenResponse> {
        const formData = new URLSearchParams();
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        formData.append('refresh_token', refreshToken);

        const response = await apiClient.post<IRefreshTokenResponse>(
            API_CONFIG.ENDPOINTS.REFRESH_TOKEN,
            formData.toString()
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        return response.data;
    },

    async logout(): Promise<ILogoutResponse> {
        const formData = new URLSearchParams();
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        if (accessToken) formData.append('access_token', accessToken);
        if (refreshToken) formData.append('refresh_token', refreshToken);

        const response = await apiClient.post<ILogoutResponse>(
            API_CONFIG.ENDPOINTS.LOGOUT,
            formData.toString()
        );

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        return response.data;
    }
};
