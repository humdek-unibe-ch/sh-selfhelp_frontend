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
import { authProvider } from '../providers/auth.provider';
import { ROUTES } from '../config/routes.config';
import { getAccessToken, getRefreshToken, storeTokens, removeTokens } from '../utils/auth.utils';
import { debug, warn, error } from '../utils/debug-logger';

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

// Shared refresh state to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

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
    
    // Notify Refine auth provider about successful refresh
    authProvider.check().catch(() => {
        // If check fails after refresh, something is wrong
        debug('Auth check failed after token refresh', 'BaseApi');
    });
};

// Helper function to handle token refresh failure
const handleTokenRefreshFailure = () => {
    removeTokens();
    delete apiClient.defaults.headers.common.Authorization;
    if (!window.location.pathname.startsWith(ROUTES.LOGIN)) {
        window.location.href = ROUTES.LOGIN;
    }   
};

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
};

// Centralized token refresh function with single execution guarantee
const performTokenRefresh = async (): Promise<string> => {
    // If already refreshing, return the existing promise
    if (isRefreshing && refreshPromise) {
        debug('Token refresh already in progress, waiting...', 'BaseApi');
        return refreshPromise;
    }

    // Set refreshing state and create new promise
    isRefreshing = true;
    refreshPromise = new Promise(async (resolve, reject) => {
        try {
            debug('Starting token refresh', 'BaseApi');
            
            const response = await AuthApi.refreshToken();

            if (response.data.access_token) {
                // Store both tokens if refresh token is also returned
                if (response.data.refresh_token) {
                    handleTokenRefreshSuccess(response.data.access_token, response.data.refresh_token);
                } else {
                    handleTokenRefreshSuccess(response.data.access_token);
                }
                
                debug('Token refresh successful', 'BaseApi');
                resolve(response.data.access_token);
            } else {
                throw new Error('Token refresh failed - no access token received');
            }
        } catch (refreshError) {
            error('Token refresh failed', 'BaseApi', refreshError);
            handleTokenRefreshFailure();
            reject(refreshError);
        } finally {
            // Reset refresh state
            isRefreshing = false;
            refreshPromise = null;
        }
    });

    return refreshPromise;
};

// Helper function to handle refresh with queue management
const handleRefreshWithQueue = async (originalRequest: InternalAxiosRequestConfig): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Add to queue if already refreshing
        if (isRefreshing) {
            debug('Adding request to refresh queue', 'BaseApi');
            failedQueue.push({ resolve, reject });
            return;
        }

        // Start refresh process
        performTokenRefresh()
            .then((token) => {
                // Process queued requests
                processQueue(null, token);
                resolve(token);
            })
            .catch((refreshError) => {
                // Process queued requests with error
                processQueue(refreshError, null);
                reject(refreshError);
            });
    });
};

// Helper functions to identify specific request types
const isLogoutRequest = (config: any) =>
    config.url === API_CONFIG.ENDPOINTS.LOGOUT;
const isRefreshTokenRequest = (config: any) =>
    config.url === API_CONFIG.ENDPOINTS.REFRESH_TOKEN;
const isAdminRequest = (config: any) =>
    config.url?.includes('/admin/');

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
 * 4. Integration with Refine auth provider
 */
apiClient.interceptors.response.use(
    async (response) => {
        // Skip check for logout requests and refresh token requests
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
                    debug('Already tried logged_in refresh, skipping', 'BaseApi');
                    handleTokenRefreshFailure();
                    return response;
                }

                // Mark this request for retry
                originalRequest._loggedInRetry = true;

                try {
                    debug('Attempting token refresh due to logged_in: false', 'BaseApi');
                    
                    // Use centralized refresh with queue management
                    const newToken = await handleRefreshWithQueue(originalRequest);

                    // Update the original request with the new token
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;

                    debug('Retrying original request after refresh', 'BaseApi');
                    // Retry the original request
                    return await apiClient(originalRequest);
                } catch (refreshError) {
                    warn('Token refresh failed for logged_in check', 'BaseApi', refreshError);
                    
                    // For frontend requests, return the original response
                    // For admin requests, this should trigger a redirect
                    if (isAdminRequest(originalRequest)) {
                        // Admin requests need strict auth
                        return Promise.reject(new Error('Authentication required for admin access'));
                    }
                    
                    // Return the original response with logged_in: false for frontend
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
            // Handle 403 Forbidden errors (permission issues)
            if (error.response?.status === 403 && getAccessToken()) {
                error('Permission denied for resource', 'BaseApi', {
                    url: error.config.url,
                    status: error.response.status
                });
                
                // Check if the response indicates the user is logged in but doesn't have permission
                const responseData = error.response.data;
                if (responseData?.logged_in === true) {
                    // User is logged in but doesn't have permission
                    // Use Refine's navigation or fallback to direct redirect
                    if (!window.location.pathname.startsWith(ROUTES.NO_ACCESS)) {
                        window.location.href = ROUTES.NO_ACCESS;
                    }
                }
            }
            return Promise.reject(error);
        }

        // Don't retry refresh token or logout requests to avoid infinite loops
        if (isLogoutRequest(originalRequest) || isRefreshTokenRequest(originalRequest)) {
            return Promise.reject(error);
        }

        // Mark this request as retried
        originalRequest._retry = true;

        try {
            debug('Attempting token refresh due to 401 error', 'BaseApi');
            
            // Use centralized refresh with queue management
            const newToken = await handleRefreshWithQueue(originalRequest);

            // Update the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            debug('Retrying original request after 401 refresh', 'BaseApi');
            // Retry the original request
            return apiClient(originalRequest);
        } catch (refreshError) {
            error('Token refresh failed for 401 error', 'BaseApi', refreshError);
            
            // Use Refine's logout method which handles navigation properly
            authProvider.logout({ redirectPath: ROUTES.LOGIN }).catch(() => {
                // Fallback if Refine logout fails
                if (!window.location.pathname.startsWith(ROUTES.LOGIN)) {
                    window.location.href = ROUTES.LOGIN;
                }
            });

            return Promise.reject(refreshError);
        }
    }
);
