/**
 * Permission-Aware API Client
 * Wrapper around apiClient that automatically attaches permission metadata
 * 
 * @module api/permission-aware-client.api
 */

import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiClient } from './base.api';

// Extend Axios request config to include permission metadata
declare module 'axios' {
    export interface AxiosRequestConfig {
        _permissionMetadata?: {
            permissions: string[];
            endpointKey: string;
        };
    }
}

/**
 * Endpoint configuration type from API_CONFIG
 */
type TEndpointConfig = { 
    route: string | ((...args: any[]) => string); 
    permissions: string[] 
};

/**
 * Permission-aware wrapper for permissionAwareApiClient.get
 * Accepts endpoint config and optional route parameters
 * 
 * @param endpointConfig - Endpoint configuration from API_CONFIG.ENDPOINTS
 * @param routeParams - Parameters to pass to route function (if route is a function)
 * @param config - Additional Axios configuration
 * 
 * @example
 * // Static route
 * await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_USERS_GET_ALL);
 * 
 * // Dynamic route with single parameter
 * await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_USERS_GET_ONE, userId);
 * 
 * // Dynamic route with multiple parameters
 * await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_PAGES_GET_ONE_WITH_LANGUAGE, pageId, languageId);
 */
async function get<T = any>(
    endpointConfig: TEndpointConfig,
    ...args: any[]
): Promise<AxiosResponse<T>> {
    // Last argument might be AxiosRequestConfig
    const lastArg = args[args.length - 1];
    const isLastArgConfig = lastArg && typeof lastArg === 'object' && 
        (lastArg.headers !== undefined || lastArg.params !== undefined || lastArg.baseURL !== undefined);
    
    const config: AxiosRequestConfig | undefined = isLastArgConfig ? args.pop() : undefined;
    const routeParams = args;

    // Extract URL from config
    const url = typeof endpointConfig.route === 'string' 
        ? endpointConfig.route 
        : endpointConfig.route(...routeParams);

    const enhancedConfig: AxiosRequestConfig = {
        ...config,
        _permissionMetadata: {
            permissions: endpointConfig.permissions,
            endpointKey: ''
        }
    };

    return apiClient.get<T>(url, enhancedConfig);
}

/**
 * Permission-aware wrapper for permissionAwareApiClient.post
 * Accepts endpoint config, data, optional route parameters, and optional config
 * 
 * @param endpointConfig - Endpoint configuration from API_CONFIG.ENDPOINTS
 * @param data - Request body data
 * @param args - Route parameters (if route is a function) and/or Axios config
 * 
 * @example
 * // Static route
 * await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_USERS_CREATE, userData);
 * 
 * // Static route with config
 * await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_USERS_CREATE, userData, { headers: {...} });
 * 
 * // Dynamic route with parameter
 * await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_USERS_GROUPS_ADD, groupData, userId);
 * 
 * // Dynamic route with parameter and config
 * await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_USERS_GROUPS_ADD, groupData, userId, { headers: {...} });
 */
async function post<T = any>(
    endpointConfig: TEndpointConfig,
    data?: any,
    ...args: any[]
): Promise<AxiosResponse<T>> {
    // Last argument might be AxiosRequestConfig
    const lastArg = args[args.length - 1];
    const isLastArgConfig = lastArg && typeof lastArg === 'object' && 
        (lastArg.headers !== undefined || lastArg.params !== undefined || lastArg.baseURL !== undefined);
    
    const config: AxiosRequestConfig | undefined = isLastArgConfig ? args.pop() : undefined;
    const routeParams = args;

    // Extract URL from config
    const url = typeof endpointConfig.route === 'string' 
        ? endpointConfig.route 
        : endpointConfig.route(...routeParams);

    const enhancedConfig: AxiosRequestConfig = {
        ...config,
        _permissionMetadata: {
            permissions: endpointConfig.permissions,
            endpointKey: ''
        }
    };

    return apiClient.post<T>(url, data, enhancedConfig);
}

/**
 * Permission-aware wrapper for permissionAwareApiClient.put
 * Accepts endpoint config, data, optional route parameters, and optional config
 * 
 * @param endpointConfig - Endpoint configuration from API_CONFIG.ENDPOINTS
 * @param data - Request body data
 * @param args - Route parameters (if route is a function) and/or Axios config
 * 
 * @example
 * // Dynamic route with parameter
 * await permissionAwareApiClient.put(API_CONFIG.ENDPOINTS.ADMIN_USERS_UPDATE, userData, userId);
 * 
 * // Dynamic route with parameter and config
 * await permissionAwareApiClient.put(API_CONFIG.ENDPOINTS.ADMIN_USERS_UPDATE, userData, userId, { headers: {...} });
 */
async function put<T = any>(
    endpointConfig: TEndpointConfig,
    data?: any,
    ...args: any[]
): Promise<AxiosResponse<T>> {
    // Last argument might be AxiosRequestConfig
    const lastArg = args[args.length - 1];
    const isLastArgConfig = lastArg && typeof lastArg === 'object' && 
        (lastArg.headers !== undefined || lastArg.params !== undefined || lastArg.baseURL !== undefined);
    
    const config: AxiosRequestConfig | undefined = isLastArgConfig ? args.pop() : undefined;
    const routeParams = args;

    // Extract URL from config
    const url = typeof endpointConfig.route === 'string' 
        ? endpointConfig.route 
        : endpointConfig.route(...routeParams);

    const enhancedConfig: AxiosRequestConfig = {
        ...config,
        _permissionMetadata: {
            permissions: endpointConfig.permissions,
            endpointKey: ''
        }
    };

    return apiClient.put<T>(url, data, enhancedConfig);
}

/**
 * Permission-aware wrapper for permissionAwareApiClient.delete
 * Accepts endpoint config, optional route parameters, and optional config
 * 
 * @param endpointConfig - Endpoint configuration from API_CONFIG.ENDPOINTS
 * @param args - Route parameters (if route is a function) and/or Axios config
 * 
 * @example
 * // Dynamic route with parameter
 * await permissionAwareApiClient.delete(API_CONFIG.ENDPOINTS.ADMIN_USERS_DELETE, userId);
 * 
 * // Dynamic route with parameter and config (e.g., with data for DELETE body)
 * await permissionAwareApiClient.delete(API_CONFIG.ENDPOINTS.FORMS_DELETE, { data: deleteRequest });
 */
async function del<T = any>(
    endpointConfig: TEndpointConfig,
    ...args: any[]
): Promise<AxiosResponse<T>> {
    // Last argument might be AxiosRequestConfig
    const lastArg = args[args.length - 1];
    const isLastArgConfig = lastArg && typeof lastArg === 'object' && 
        (lastArg.headers !== undefined || lastArg.params !== undefined || lastArg.baseURL !== undefined || lastArg.data !== undefined);
    
    const config: AxiosRequestConfig | undefined = isLastArgConfig ? args.pop() : undefined;
    const routeParams = args;

    // Extract URL from config
    const url = typeof endpointConfig.route === 'string' 
        ? endpointConfig.route 
        : endpointConfig.route(...routeParams);

    const enhancedConfig: AxiosRequestConfig = {
        ...config,
        _permissionMetadata: {
            permissions: endpointConfig.permissions,
            endpointKey: ''
        }
    };

    return apiClient.delete<T>(url, enhancedConfig);
}

/**
 * Permission-aware wrapper for permissionAwareApiClient.patch
 * Accepts endpoint config, data, optional route parameters, and optional config
 * 
 * @param endpointConfig - Endpoint configuration from API_CONFIG.ENDPOINTS
 * @param data - Request body data
 * @param args - Route parameters (if route is a function) and/or Axios config
 * 
 * @example
 * // Dynamic route with parameter
 * await permissionAwareApiClient.patch(API_CONFIG.ENDPOINTS.ADMIN_USERS_BLOCK, blockData, userId);
 */
async function patch<T = any>(
    endpointConfig: TEndpointConfig,
    data?: any,
    ...args: any[]
): Promise<AxiosResponse<T>> {
    // Last argument might be AxiosRequestConfig
    const lastArg = args[args.length - 1];
    const isLastArgConfig = lastArg && typeof lastArg === 'object' && 
        (lastArg.headers !== undefined || lastArg.params !== undefined || lastArg.baseURL !== undefined);
    
    const config: AxiosRequestConfig | undefined = isLastArgConfig ? args.pop() : undefined;
    const routeParams = args;

    // Extract URL from config
    const url = typeof endpointConfig.route === 'string' 
        ? endpointConfig.route 
        : endpointConfig.route(...routeParams);

    const enhancedConfig: AxiosRequestConfig = {
        ...config,
        _permissionMetadata: {
            permissions: endpointConfig.permissions,
            endpointKey: ''
        }
    };

    return apiClient.patch<T>(url, data, enhancedConfig);
}

/**
 * Export permission-aware API client
 * ONLY accepts endpoint config objects with permissions
 * This is the ONLY way to make API calls - ensures all calls have permission metadata
 */
export const permissionAwareApiClient = {
    get,
    post,
    put,
    delete: del,
    patch
};

/**
 * DO NOT export apiClient directly - force usage of permissionAwareApiClient
 * If you need the raw client for special cases, import it directly from base.api.ts
 */

