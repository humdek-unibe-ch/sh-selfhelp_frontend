/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Cache Management React Query Hooks
 * Handles cache statistics, health, and management operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { AdminCacheApi } from '../api/admin/cache.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import type { IClearCacheCategoryRequest, IClearUserCacheRequest } from '../types/requests/admin/cache.types';

/**
 * Fetch cache statistics
 */
export function useCacheStats() {
    return useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.CACHE_STATS,
        queryFn: async () => {
            const response = await AdminCacheApi.getCacheStats();
            return response.data;
        },
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
    });
}

/**
 * Fetch cache health status
 */
export function useCacheHealth() {
    return useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.CACHE_HEALTH,
        queryFn: async () => {
            const response = await AdminCacheApi.getCacheHealth();
            return response.data;
        },
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
    });
}

/**
 * Clear all caches mutation
 */
export function useClearAllCachesMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => AdminCacheApi.clearAllCaches(),
        onSuccess: (_response) => {
            // Invalidate cache-related queries
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.CACHE_STATS });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.CACHE_HEALTH });
            
            notifications.show({
                title: 'Success',
                message: 'All caches cleared successfully',
                color: 'green',
                autoClose: 3000,
            });
        },
        onError: (error: unknown) => {
            notifications.show({
                title: 'Error',
                message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to clear all caches',
                color: 'red',
                autoClose: 5000,
            });
        },
    });
}

/**
 * Clear cache category mutation
 */
export function useClearCacheCategoryMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: IClearCacheCategoryRequest) => AdminCacheApi.clearCacheCategory(data),
        onSuccess: (response, variables) => {
            // Invalidate cache-related queries
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.CACHE_STATS });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.CACHE_HEALTH });
            
            notifications.show({
                title: 'Success',
                message: `Cache category "${variables.category}" cleared successfully`,
                color: 'green',
                autoClose: 3000,
            });
        },
        onError: (error: unknown) => {
            notifications.show({
                title: 'Error',
                message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to clear cache category',
                color: 'red',
                autoClose: 5000,
            });
        },
    });
}

/**
 * Clear user cache mutation
 */
export function useClearUserCacheMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: IClearUserCacheRequest) => AdminCacheApi.clearUserCache(data),
        onSuccess: (response, variables) => {
            // Invalidate cache-related queries
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.CACHE_STATS });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.CACHE_HEALTH });
            
            notifications.show({
                title: 'Success',
                message: `Cache for user ID ${variables.user_id} cleared successfully`,
                color: 'green',
                autoClose: 3000,
            });
        },
        onError: (error: unknown) => {
            notifications.show({
                title: 'Error',
                message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to clear user cache',
                color: 'red',
                autoClose: 5000,
            });
        },
    });
}

/**
 * Reset cache statistics mutation
 */
export function useResetCacheStatsMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => AdminCacheApi.resetCacheStats(),
        onSuccess: () => {
            // Invalidate cache-related queries
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.CACHE_STATS });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.CACHE_HEALTH });
            
            notifications.show({
                title: 'Success',
                message: 'Cache statistics reset successfully',
                color: 'green',
                autoClose: 3000,
            });
        },
        onError: (error: unknown) => {
            notifications.show({
                title: 'Error',
                message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reset cache statistics',
                color: 'red',
                autoClose: 5000,
            });
        },
    });
};
