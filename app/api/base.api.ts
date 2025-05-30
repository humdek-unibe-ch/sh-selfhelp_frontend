/**
 * Base API client configuration and interceptor setup.
 * Handles authentication token management, request/response interceptors,
 * and automatic token refresh functionality.
 * 
 * @module api/base.api
 */

import axios, { InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api.config';
import { AuthApi } from './auth.api';
import { authProvider } from '@/providers/auth.provider';
import { ROUTES } from '@/config/routes.config';
import { getAccessToken, getRefreshToken, storeTokens, removeTokens } from '@/utils/auth.utils';

// Extend Axios request config to include our custom properties
declare module 'axios' {
    export interface InternalAxiosRequestConfig {
        _retry?: boolean;
        _loggedInRetry?: boolean;
    }
}

/**
 * Axios instance configured with base URL and default headers.
 * Used as the main HTTP client throughout the application.
 */
export const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    withCredentials: API_CONFIG.CORS_CONFIG.credentials,
    headers: API_CONFIG.CORS_CONFIG.headers
});

// Keep track of refresh token request to prevent multiple simultaneous refreshes
let failedQueue: any[] = [];


// Helper function to handle token refresh success
const handleTokenRefreshSuccess = (accessToken: string, refreshToken?: string) => {
    // If both tokens are provided, store them
    if (refreshToken) {
        storeTokens(accessToken, refreshToken);
    } else {
        // Otherwise just update the access token
        localStorage.setItem('access_token', accessToken);
        // Update cookie for middleware
        document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60}; SameSite=Strict`;
    }
    
    // Update axios default headers
    apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
};

// Helper function to handle token refresh failure
const handleTokenRefreshFailure = () => {
    removeTokens();
    delete apiClient.defaults.headers.common.Authorization;
};

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Helper function to perform token refresh
const performTokenRefresh = async () => {
    try {
        const response = await AuthApi.refreshToken();
        authProvider.check();

        if (response.data.access_token) {
            // Store both tokens if refresh token is also returned
            if (response.data.refresh_token) {
                handleTokenRefreshSuccess(response.data.access_token, response.data.refresh_token);
            } else {
                handleTokenRefreshSuccess(response.data.access_token);
            }
            return response.data.access_token;
        }

        // If we get here, something went wrong but not an invalid token
        handleTokenRefreshFailure();
        throw new Error('Token refresh failed - no access token received');
    } catch (error) {
        handleTokenRefreshFailure();
        throw error;
    }
};

// Helper functions to identify specific request types
const isLogoutRequest = (config: any) =>
    config.url === API_CONFIG.ENDPOINTS.LOGOUT;
const isRefreshTokenRequest = (config: any) =>
    config.url === API_CONFIG.ENDPOINTS.REFRESH_TOKEN;

/**
 * Request interceptor to add authentication token to outgoing requests.
 * Retrieves the access token and appends it to the Authorization header if available.
 * Also adds the X-Client-Type header for all requests.
 */
apiClient.interceptors.request.use(
    (config) => {
        // Add client type header for all requests
        config.headers['X-Client-Type'] = 'web';
        
        // Add authorization header if token exists
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            // Clear authorization header if no token
            config.headers.Authorization = '';
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor to handle:
 * 1. Authentication state based on logged_in flag from server
 * 2. Token refresh when logged_in is false or on 401 errors
 * 3. Automatic retry of failed requests after token refresh
 */
apiClient.interceptors.response.use(
    async (response) => {
        // Skip check for logout requests
        if (isLogoutRequest(response.config) || isRefreshTokenRequest(response.config)) {
            return response;
        }

        // Check for logged_in flag in successful responses
        if ('logged_in' in response.data) {

            // If server says not logged in but we have tokens, attempt to refresh
            if (!response.data.logged_in && getRefreshToken()) {
                const originalRequest = response.config;

                // Prevent infinite loops
                if (originalRequest._loggedInRetry) {
                    // If we've already tried to refresh based on logged_in flag, clear tokens and fail
                    handleTokenRefreshFailure();
                    return response;
                }

                // Mark this request for retry
                originalRequest._loggedInRetry = true;

                try {

                    // Attempt to refresh the token
                    const newToken = await performTokenRefresh();

                    // Update the original request with the new token
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;

                    // Process any queued requests
                    processQueue(null, newToken);

                    // Retry the original request
                    return await apiClient(originalRequest);
                } catch (refreshError) {
                    // If refresh fails, clear auth data
                    processQueue(refreshError, null);
                    handleTokenRefreshFailure();

                    // Return the original response with logged_in: false
                    return response;
                }
            }
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Don't retry if it's not a 401 or if we've already retried
        if (error.response?.status !== 401 || originalRequest._retry) {
            // If it's a 403 and we're authenticated, it could be a permission issue
            if (error.response?.status === 403 && getAccessToken()) {
                console.error('Permission denied for this resource');
            }
            return Promise.reject(error);
        }

        // Don't retry refresh token or logout requests to avoid infinite loops
        if (isLogoutRequest(originalRequest) || isRefreshTokenRequest(originalRequest)) {
            return Promise.reject(error);
        }

        // Mark this request as retried and start the refresh process
        originalRequest._retry = true;

        try {
            const newToken = await performTokenRefresh();

            // Update the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Process any queued requests with the new token
            processQueue(null, newToken);

            // Retry the original request
            return apiClient(originalRequest);
        } catch (refreshError) {
            // If refresh fails, clear auth data and redirect to login
            processQueue(refreshError, null);
            handleTokenRefreshFailure();

            // Only redirect if we're not already on the login page
            if (!window.location.pathname.startsWith(ROUTES.LOGIN)) {
                window.location.href = ROUTES.LOGIN;
            }

            return Promise.reject(refreshError);
        }
    }
);
