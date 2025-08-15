/**
 * Admin Cache API Service
 * Handles all cache management operations
 */

import { apiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IClearCacheCategoryRequest, IClearUserCacheRequest } from '../../types/requests/admin/cache.types';
import type { ICacheClearedResponse, ICacheHealthResponse, ICacheStatsResponse } from '../../types/responses/admin/cache.types';
import type { IResponseEnvelope } from '../../types/responses/common/response-envelope.types';

export const AdminCacheApi = {
    /**
     * Get cache statistics including global stats, category stats, and cache pools
     */
    async getCacheStats(): Promise<IResponseEnvelope<ICacheStatsResponse>> {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN_CACHE_STATS);
        return response.data;
    },

    /**
     * Clear all caches
     */
    async clearAllCaches(): Promise<IResponseEnvelope<ICacheClearedResponse>> {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.ADMIN_CACHE_CLEAR_ALL);
        return response.data;
    },

    /**
     * Clear cache for a specific category
     */
    async clearCacheCategory(data: IClearCacheCategoryRequest): Promise<IResponseEnvelope<ICacheClearedResponse>> {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.ADMIN_CACHE_CLEAR_CATEGORY, data);
        return response.data;
    },

    /**
     * Clear cache for a specific user
     */
    async clearUserCache(data: IClearUserCacheRequest): Promise<IResponseEnvelope<ICacheClearedResponse>> {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.ADMIN_CACHE_CLEAR_USER, data);
        return response.data;
    },

    /**
     * Reset cache statistics
     */
    async resetCacheStats(): Promise<IResponseEnvelope<ICacheClearedResponse>> {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.ADMIN_CACHE_RESET_STATS);
        return response.data;
    },

    /**
     * Get cache health status with recommendations
     */
    async getCacheHealth(): Promise<IResponseEnvelope<ICacheHealthResponse>> {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN_CACHE_HEALTH);
        return response.data;
    },
};
