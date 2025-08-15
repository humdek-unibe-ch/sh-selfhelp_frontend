import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { AdminSectionUtilityApi } from '../api/admin/section-utility.api';
import { AdminCacheApi } from '../api/admin/cache.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import type { IUnusedSectionsData, IRefContainerSectionsData } from '../types/responses/admin/section-utility.types';

/**
 * Hook to fetch unused sections (not in hierarchy and not assigned to pages)
 */
export function useUnusedSections(enabled: boolean = true) {
    return useQuery({
        queryKey: ['admin', 'sections', 'unused'],
        queryFn: async () => {
            const response = await AdminSectionUtilityApi.getUnusedSections();
            return response.data;
        },
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        retry: 3,
        retryDelay: 1000,
        enabled,
    });
}

/**
 * Hook to fetch sections with refContainer style
 */
export function useRefContainerSections(enabled: boolean = true) {
    return useQuery({
        queryKey: ['admin', 'sections', 'ref-containers'],
        queryFn: async () => {
            const response = await AdminSectionUtilityApi.getRefContainers();
            return response.data;
        },
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        retry: 3,
        retryDelay: 1000,
        enabled,
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

/**
 * Hook to delete a specific unused section
 */
export function useDeleteUnusedSectionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sectionId: number) => AdminSectionUtilityApi.deleteUnusedSection(sectionId),
        onSuccess: (data) => {
            notifications.show({
                title: 'Success',
                message: data.message || 'Section deleted successfully',
                color: 'green',
            });

            // Invalidate unused sections queries
            queryClient.invalidateQueries({ queryKey: ['admin', 'sections', 'unused'] });
        },
        onError: (error: any) => {
            console.error('Failed to delete unused section:', error);
            notifications.show({
                title: 'Error',
                message: error?.response?.data?.message || 'Failed to delete section',
                color: 'red',
                autoClose: false,
            });
        },
    });
}

/**
 * Hook to delete all unused sections
 */
export function useDeleteAllUnusedSectionsMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => AdminSectionUtilityApi.deleteAllUnusedSections(),
        onSuccess: (data) => {
            notifications.show({
                title: 'Success',
                message: data.message || 'All unused sections deleted successfully',
                color: 'green',
            });

            // Invalidate unused sections queries
            queryClient.invalidateQueries({ queryKey: ['admin', 'sections', 'unused'] });
        },
        onError: (error: any) => {
            console.error('Failed to delete all unused sections:', error);
            notifications.show({
                title: 'Error',
                message: error?.response?.data?.message || 'Failed to delete all sections',
                color: 'red',
                autoClose: false,
            });
        },
    });
}

/**
 * Hook to force delete a section from a page
 */
export function useForceDeleteSectionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ pageKeyword, sectionId }: { pageKeyword: string; sectionId: number }) => 
            AdminSectionUtilityApi.forceDeleteSection(pageKeyword, sectionId),
        onSuccess: (data, variables) => {
            notifications.show({
                title: 'Success',
                message: data.message || 'Section force deleted successfully',
                color: 'green',
            });

            // Invalidate page sections and unused sections queries
            queryClient.invalidateQueries({ queryKey: ['adminPages'] });
            queryClient.invalidateQueries({ queryKey: ['page-content'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'sections', 'unused'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'pages', variables.pageKeyword, 'sections'] });
        },
        onError: (error: any) => {
            console.error('Failed to force delete section:', error);
            notifications.show({
                title: 'Error',
                message: error?.response?.data?.message || 'Failed to force delete section',
                color: 'red',
                autoClose: false,
            });
        },
    });
}
