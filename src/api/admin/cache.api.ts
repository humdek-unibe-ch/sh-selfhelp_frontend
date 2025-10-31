/**
 * Admin Cache API Service
 * Handles all cache management operations
 */

import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IClearCacheCategoryRequest, IClearUserCacheRequest } from '../../types/requests/admin/cache.types';
import type { ICacheClearedResponse, ICacheHealthResponse, ICacheStatsResponse } from '../../types/responses/admin/cache.types';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';

export const AdminCacheApi = {
    /**
     * Get cache statistics including global stats, category stats, and cache pools
     */
    async getCacheStats(): Promise<IBaseApiResponse<ICacheStatsResponse>> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_CACHE_STATS);
        return response.data;
    },

    /**
     * Clear all caches
     */
    async clearAllCaches(): Promise<IBaseApiResponse<ICacheClearedResponse>> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_CACHE_CLEAR_ALL);
        return response.data;
    },

    /**
     * Clear cache for a specific category
     */
    async clearCacheCategory(data: IClearCacheCategoryRequest): Promise<IBaseApiResponse<ICacheClearedResponse>> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_CACHE_CLEAR_CATEGORY, data);
        return response.data;
    },

    /**
     * Clear cache for a specific user
     */
    async clearUserCache(data: IClearUserCacheRequest): Promise<IBaseApiResponse<ICacheClearedResponse>> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_CACHE_CLEAR_USER, data);
        return response.data;
    },

    /**
     * Reset cache statistics
     */
    async resetCacheStats(): Promise<IBaseApiResponse<ICacheClearedResponse>> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_CACHE_RESET_STATS);
        return response.data;
    },

    /**
     * Get cache health status with recommendations
     */
    async getCacheHealth(): Promise<IBaseApiResponse<ICacheHealthResponse>> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_CACHE_HEALTH);
        return response.data;
    },

    /**
     * Clear API routes cache
     */
    async clearApiRoutesCache(): Promise<IBaseApiResponse<ICacheClearedResponse>> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_CACHE_CLEAR_API_ROUTES);
        return response.data;
    },
};
