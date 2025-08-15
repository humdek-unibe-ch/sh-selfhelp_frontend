import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { AdminSectionUtilityApi } from '../api/admin/section-utility.api';
import { AdminCacheApi } from '../api/admin/cache.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import type { IUnusedSectionsData, IRefContainerSectionsData } from '../types/responses/admin/section-utility.types';

/**
 * Hook to fetch unused sections (not in hierarchy and not assigned to pages)
 */
export function useUnusedSections() {
    return useQuery({
        queryKey: ['admin', 'sections', 'unused'],
        queryFn: async () => {
            const response = await AdminSectionUtilityApi.getUnusedSections();
            return response.data;
        },
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        select: (data: IUnusedSectionsData) => data,
    });
}

/**
 * Hook to fetch sections with refContainer style
 */
export function useRefContainerSections() {
    return useQuery({
        queryKey: ['admin', 'sections', 'ref-containers'],
        queryFn: async () => {
            const response = await AdminSectionUtilityApi.getRefContainers();
            return response.data;
        },
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        select: (data: IRefContainerSectionsData) => data,
    });
}

/**
 * Hook to clear API routes cache
 */
export function useClearApiRoutesCacheMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => AdminCacheApi.clearApiRoutesCache(),
        onSuccess: (data) => {
            notifications.show({
                title: 'Success',
                message: data.message || 'API routes cache cleared successfully',
                color: 'green',
            });

            // Invalidate cache-related queries
            queryClient.invalidateQueries({ queryKey: ['admin', 'cache'] });
        },
        onError: (error: any) => {
            console.error('Failed to clear API routes cache:', error);
            notifications.show({
                title: 'Error',
                message: error?.response?.data?.message || 'Failed to clear API routes cache',
                color: 'red',
            });
        },
    });
}
