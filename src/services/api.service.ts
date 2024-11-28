import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { AuthService } from './auth.service';

export const apiClient = axios.create({
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
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const response = await AuthService.refreshToken();

                // Update the access token
                localStorage.setItem('access_token', response.data.access_token);
                localStorage.setItem('expires_in', response.data.expires_in.toString());

                // Update the Authorization header
                originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;

                // Retry the original request
                return apiClient(originalRequest);
            } catch (refreshError) {
                // If refresh fails, clear tokens and redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);
