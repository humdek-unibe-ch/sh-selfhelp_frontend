/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Permission-Aware API Client
 * Wrapper around apiClient that automatically attaches permission metadata
 * 
 * @module api/permission-aware-client.api
 */

import { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { apiClient } from './base.api';

// Extend Axios request config to include permission metadata
declare module 'axios' {
    export interface AxiosRequestConfig {
        _permissionMetadata?: {
            permissions: string[];
        };
    }
}

/**
 * Endpoint configuration type from API_CONFIG
 */
type TEndpointConfig = { 
    route: string | ((...args: never[]) => string); 
    permissions: string[] 
};

/**
 * Split the variadic call arguments into route params + an optional trailing
 * `AxiosRequestConfig`, build the upstream URL, and attach the permission
 * metadata the request interceptor enforces.
 *
 * The trailing argument is treated as config when it looks like one (has
 * `headers`/`params`/`baseURL`, plus `data` for DELETE bodies); everything
 * before it is a route parameter. This heuristic is safe because every route
 * param in `API_CONFIG` is a primitive (id / keyword), never a config-shaped
 * object. Centralizing it here keeps the per-verb wrappers to one line each and
 * keeps the one fragile assumption documented in a single place.
 */
function buildPermissionAwareRequest(
    endpointConfig: TEndpointConfig,
    args: unknown[],
    allowDataConfig = false,
): { url: string; config: AxiosRequestConfig } {
    const lastArg = args[args.length - 1] as AxiosRequestConfig | undefined;
    const isLastArgConfig =
        !!lastArg &&
        typeof lastArg === 'object' &&
        (lastArg.headers !== undefined ||
            lastArg.params !== undefined ||
            lastArg.baseURL !== undefined ||
            (allowDataConfig && lastArg.data !== undefined));

    const config: AxiosRequestConfig | undefined = isLastArgConfig
        ? (args.pop() as AxiosRequestConfig)
        : undefined;
    const routeParams = args;

    const url =
        typeof endpointConfig.route === 'string'
            ? endpointConfig.route
            : (endpointConfig.route as (...a: unknown[]) => string)(...routeParams);

    return {
        url,
        config: {
            ...config,
            _permissionMetadata: { permissions: endpointConfig.permissions },
        },
    };
}

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
 * await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_PAGES_GET_ONE, pageId);
 */
async function get<T = unknown>(
    endpointConfig: TEndpointConfig,
    ...args: unknown[]
): Promise<AxiosResponse<T>> {
    const { url, config } = buildPermissionAwareRequest(endpointConfig, args);
    return apiClient.get<T>(url, config);
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
async function post<T = unknown>(
    endpointConfig: TEndpointConfig,
    data?: unknown,
    ...args: unknown[]
): Promise<AxiosResponse<T>> {
    const { url, config } = buildPermissionAwareRequest(endpointConfig, args);
    return apiClient.post<T>(url, data, config);
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
async function put<T = unknown>(
    endpointConfig: TEndpointConfig,
    data?: unknown,
    ...args: unknown[]
): Promise<AxiosResponse<T>> {
    const { url, config } = buildPermissionAwareRequest(endpointConfig, args);
    return apiClient.put<T>(url, data, config);
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
async function del<T = unknown>(
    endpointConfig: TEndpointConfig,
    ...args: unknown[]
): Promise<AxiosResponse<T>> {
    // DELETE may carry a body via `{ data }`, so allow that as config too.
    const { url, config } = buildPermissionAwareRequest(endpointConfig, args, true);
    return apiClient.delete<T>(url, config);
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
async function patch<T = unknown>(
    endpointConfig: TEndpointConfig,
    data?: unknown,
    ...args: unknown[]
): Promise<AxiosResponse<T>> {
    const { url, config } = buildPermissionAwareRequest(endpointConfig, args);
    return apiClient.patch<T>(url, data, config);
}

/**
 * Permission-aware API client.
 *
 * Each method takes an endpoint config object (`{ route, permissions }` from
 * `API_CONFIG.ENDPOINTS`) and attaches the permission metadata the request
 * interceptor (`permission-wrapper.api.ts`) enforces. This is the default,
 * required path for browser API calls in domain API clients.
 *
 * The raw `apiClient` (`base.api.ts`) remains available for the rare internal
 * cases that legitimately cannot use an endpoint config (see the AGENTS.md API
 * Rules); it is intentionally not re-exported from here so the permission-aware
 * path stays the obvious default.
 */
export const permissionAwareApiClient = {
    get,
    post,
    put,
    delete: del,
    patch
};

