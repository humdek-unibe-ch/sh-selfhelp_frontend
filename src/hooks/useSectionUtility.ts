/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { AdminSectionUtilityApi } from '../api/admin/section-utility.api';
import { AdminSectionApi } from '../api/admin/section.api';
import { AdminCacheApi } from '../api/admin/cache.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import type { IUnusedSectionsData, IRefContainerSectionsData, ISectionPage } from '../types/responses/admin/section-utility.types';

/**
 * Hook to fetch unused sections (not in hierarchy and not assigned to pages)
 */
export function useUnusedSections(enabled: boolean = true) {
    return useQuery<IUnusedSectionsData>({
        queryKey: ['admin', 'sections', 'unused'],
        queryFn: async (): Promise<IUnusedSectionsData> => {
            const response = await AdminSectionUtilityApi.getUnusedSections();
            return response || [];
        },
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
        retry: 3,
        retryDelay: 1000,
        enabled,
    });
}

/**
 * Hook to fetch sections with refContainer style
 */
export function useRefContainerSections(enabled: boolean = true) {
    return useQuery<IRefContainerSectionsData>({
        queryKey: ['admin', 'sections', 'ref-containers'],
        queryFn: async (): Promise<IRefContainerSectionsData> => {
            const response = await AdminSectionUtilityApi.getRefContainers();
            return response || [];
        },
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
        retry: 3,
        retryDelay: 1000,
        enabled,
    });
}

/**
 * Hook to fetch all pages that contain a given section
 */
export function useSectionPages(sectionId: number | null, enabled: boolean = true) {
    return useQuery<ISectionPage[]>({
        queryKey: ['admin', 'sections', sectionId, 'pages'],
        queryFn: async (): Promise<ISectionPage[]> => {
            return AdminSectionApi.getSectionPages(sectionId!);
        },
        staleTime: 0,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
        enabled: enabled && !!sectionId,
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
        mutationFn: ({ pageId, sectionId }: { pageId: number; sectionId: number }) => 
            AdminSectionUtilityApi.forceDeleteSection(pageId, sectionId),
        onSuccess: (data, variables) => {
            notifications.show({
                title: 'Success',
                message: data.message || 'Section force deleted successfully',
                color: 'green',
            });

            // Invalidate page sections and unused sections queries
            queryClient.invalidateQueries({ queryKey: ['adminPages'] });
            queryClient.invalidateQueries({ queryKey: ['page-by-keyword'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'sections', 'unused'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'pages', variables.pageId, 'sections'] });
        },
        onError: (error: any) => {

            notifications.show({
                title: 'Error',
                message: error?.response?.data?.message || 'Failed to force delete section',
                color: 'red',
                autoClose: false,
            });
        },
    });
}
