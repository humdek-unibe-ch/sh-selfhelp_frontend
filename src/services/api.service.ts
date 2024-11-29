/**
 * API client configuration and interceptor setup.
 * Handles authentication token management, request/response interceptors,
 * and automatic token refresh functionality.
 * 
 * @module services/api.service
 */

import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { AuthService } from './auth.service';

/**
 * Axios instance configured with base URL and default headers.
 * Used as the main HTTP client throughout the application.
 */
export const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

/**
 * Request interceptor to add authentication token to outgoing requests.
 * Retrieves the access token from local storage and appends it to the
 * Authorization header if available.
 * 
 * @param {Object} config - Axios request configuration
 * @returns {Object} Updated request configuration
 */
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Response interceptor to handle token refresh and authentication errors.
 * - Skips interceptor for refresh token requests
 * - Handles automatic token refresh when access token expires
 * - Manages authentication state based on server responses
 * 
 * @param {Object} response - Axios response object
 * @returns {Object} Updated response object or a new promise
 */
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
