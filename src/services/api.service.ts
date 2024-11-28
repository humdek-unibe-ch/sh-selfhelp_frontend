import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { IApiResponse, IPageContent } from '@/types/api/requests.type';
import { INavigationItem } from '@/types/api/navigation.type';
import { ILoginRequest, ILoginResponse, ILogoutResponse, IRefreshTokenResponse } from '@/types/api/auth.type';

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    }
});

// Add a request interceptor to add the auth token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add a response interceptor to handle token refresh
apiClient.interceptors.response.use(
    async (response) => {
        // Skip interceptor for refresh token requests
        if (response.config.url?.includes(API_CONFIG.ENDPOINTS.REFRESH_TOKEN)) {
            return response;
        }

        // Check if response has logged_in=false but we have stored tokens
        if (response.data?.logged_in === false &&
            localStorage.getItem('access_token') &&
            localStorage.getItem('refresh_token')) {

            try {
                // Try to refresh the token
                const refreshResponse = await AuthService.refreshToken();

                // Update the tokens
                localStorage.setItem('access_token', refreshResponse.data.access_token);
                localStorage.setItem('expires_in', refreshResponse.data.expires_in.toString());

                // Retry the original request with new token
                const originalRequest = response.config;
                originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // If refresh fails, clear tokens and redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('expires_in');
                window.location.href = '/auth/auth1/login';
                return Promise.reject(refreshError);
            }
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Skip interceptor for refresh token requests
        if (originalRequest.url?.includes('/refresh-token')) {
            return Promise.reject(error);
        }

        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh the token
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await AuthService.refreshToken();

                // Update the access token
                localStorage.setItem('access_token', response.data.access_token);
                localStorage.setItem('expires_in', response.data.expires_in.toString());

                // Update the Authorization header
                originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;

                // Retry the original request
                return apiClient(originalRequest);
            } catch (refreshError) {
                // If refresh fails, redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('expires_in');
                window.location.href = '/auth/auth1/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const NavigationService = {
    getRoutes: async (): Promise<INavigationItem[]> => {
        const response = await apiClient.get<IApiResponse<INavigationItem[]>>(API_CONFIG.ENDPOINTS.ALL_ROUTES);
        return response.data.data;
    }
};

export const PageService = {
    getPageContent: async (keyword: string): Promise<IPageContent> => {
        const response = await apiClient.get<IApiResponse<IPageContent>>(API_CONFIG.ENDPOINTS.PAGE(keyword));
        return response.data.data;
    },

    updatePageContent: async (keyword: string, content: any): Promise<IApiResponse<any>> => {
        try {
            const response = await apiClient.put<IApiResponse<any>>(API_CONFIG.ENDPOINTS.PAGE(keyword), content);
            return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                return error.response.data;
            }
            throw error;
        }
    }
};

export const AuthService = {
    login: async (credentials: ILoginRequest): Promise<ILoginResponse> => {
        const formData = new URLSearchParams();
        formData.append('user', credentials.user);
        formData.append('password', credentials.password);

        const response = await apiClient.post<ILoginResponse>(
            API_CONFIG.ENDPOINTS.LOGIN,
            formData.toString()
        );
        return response.data;
    },

    refreshToken: async (): Promise<IRefreshTokenResponse> => {
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

    logout: async (): Promise<ILogoutResponse> => {
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
