/**
 * React Query hooks for fetching page sections and fields
 * Provides separate hooks for better performance and caching
 * 
 * @module hooks/usePageDetails
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminApi } from '../api/admin.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { notifications } from '@mantine/notifications';
import type { IPageDetailsData } from '../types/responses/admin/admin.types';
import type { IUpdatePageRequest } from '../types/requests/admin/update-page.types';
import { debug } from '../utils/debug-logger';

/**
 * Hook for fetching page details by keyword
 * @param keyword - The page keyword to fetch details for
 * @param enabled - Whether the query should be enabled
 * @returns React Query result with page details
 */
export function usePageDetails(keyword: string | null, enabled: boolean = true) {
    const queryKey = ['pageDetails', keyword];
    
    // More explicit enabled condition
    const isEnabled = enabled && keyword !== null && keyword !== undefined && keyword !== '';
    
    return useQuery<IPageDetailsData>({
        queryKey,
        queryFn: async () => {
            if (!keyword) {
                throw new Error('Keyword is required');
            }
            return AdminApi.getPageDetails(keyword);
        },
        enabled: isEnabled,
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
}

/**
 * Hook to fetch page sections by keyword
 * @param keyword - The page keyword
 * @param enabled - Whether the query should be enabled
 * @returns React Query result with page sections data
 */
export function usePageSections(keyword: string | null, enabled: boolean = true) {
    return useQuery({
        queryKey: ['pageSections', keyword],
        queryFn: async () => {
            if (!keyword) throw new Error('Keyword is required');
            debug('Fetching page sections', 'usePageSections', { keyword });
            const sections = await AdminApi.getPageSections(keyword);
            return { sections, page_keyword: keyword };
        },
        enabled: enabled && !!keyword,
    });
}

/**
 * Hook to fetch page fields by keyword
 * @param keyword - The page keyword
 * @param enabled - Whether the query should be enabled
 * @returns React Query result with page fields data
 */
export function usePageFields(keyword: string | null, enabled: boolean = true) {
    return useQuery({
        queryKey: ['pageFields', keyword],
        queryFn: async () => {
            if (!keyword) throw new Error('Keyword is required');
            debug('Fetching page fields', 'usePageFields', { keyword });
            const data = await AdminApi.getPageFields(keyword);
            return data;
        },
        enabled: enabled && !!keyword,
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
} 