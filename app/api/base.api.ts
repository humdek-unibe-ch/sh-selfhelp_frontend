/**
 * Base API client configuration and interceptor setup.
 * Handles authentication token management, request/response interceptors,
 * and automatic token refresh functionality.
 * 
 * @module api/base.api
 */

import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { AuthApi } from './auth.api';

// Event to notify about authentication state changes
export const authStateChangeEvent = new CustomEvent('authStateChange', {
    detail: { isAuthenticated: false }
});

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
let isRefreshing = false;
let failedQueue: any[] = [];

/**
 * Updates authentication state and dispatches event
 */
const updateAuthState = (isAuthenticated: boolean) => {
    authStateChangeEvent.detail.isAuthenticated = isAuthenticated;
    window.dispatchEvent(authStateChangeEvent);
};

// Helper function to handle token refresh success
const handleTokenRefreshSuccess = (accessToken: string) => {
    localStorage.setItem('access_token', accessToken);
    apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    updateAuthState(true);
};

// Helper function to handle token refresh failure
const handleTokenRefreshFailure = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('expires_in');
    delete apiClient.defaults.headers.common.Authorization;
    updateAuthState(false);
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
        
        if (response.data.access_token) {
            handleTokenRefreshSuccess(response.data.access_token);
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
const isRefreshTokenRequest = (config: any) => 
    config.url === API_CONFIG.ENDPOINTS.REFRESH_TOKEN;

const isLogoutRequest = (config: any) => 
    config.url === API_CONFIG.ENDPOINTS.LOGOUT;

/**
 * Request interceptor to add authentication token to outgoing requests.
 * Retrieves the access token from local storage and appends it to the
 * Authorization header if available.
 */
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
 * 2. Token refresh on 401 errors
 * 3. Automatic retry of failed requests after token refresh
 */
apiClient.interceptors.response.use(
    async (response) => {
        // Don't process logged_in flag for refresh token or logout endpoint responses
        if ('logged_in' in response.data && !isRefreshTokenRequest(response.config) && !isLogoutRequest(response.config)) {
            updateAuthState(response.data.logged_in);
            
            // If server says not logged in but we have a token, try to refresh
            if (!response.data.logged_in && localStorage.getItem('access_token')) {
                if (isRefreshing) {
                    try {
                        const token = await new Promise((resolve, reject) => {
                            failedQueue.push({ resolve, reject });
                        });
                        response.config.headers.Authorization = `Bearer ${token}`;
                        return apiClient(response.config);
                    } catch (err) {
                        updateAuthState(false);
                        return Promise.reject(err);
                    }
                }

                isRefreshing = true;
                try {
                    const newToken = await performTokenRefresh();
                    processQueue(null, newToken);
                    response.config.headers.Authorization = `Bearer ${newToken}`;
                    return apiClient(response.config);
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    updateAuthState(false);
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }
        }
        return response;
    },

    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If already refreshing, queue this request
                try {
                    const token = await new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    });
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                } catch (err) {
                    updateAuthState(false);
                    window.location.href = '/auth/login';
                    return Promise.reject(err);
                }
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newToken = await performTokenRefresh();
                processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                updateAuthState(false);
                window.location.href = '/auth/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
