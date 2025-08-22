/**
 * React Query hooks for fetching page sections and fields
 * Provides separate hooks for better performance and caching
 * 
 * @module hooks/usePageDetails
 */

import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '../api/admin.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

/**
 * Hook to fetch page sections by page ID
 * @param pageId - The page ID
 * @param enabled - Whether the query should be enabled
 * @returns React Query result with page sections data
 */
export function usePageSections(pageId: number | null, enabled: boolean = true) {
    return useQuery({
        queryKey: ['pageSections', pageId],
        queryFn: async () => {
            if (!pageId) throw new Error('Page ID is required');
            const sections = await AdminApi.getPageSections(pageId);
            return { sections, page_id: pageId };
        },
        enabled: enabled && !!pageId,
    });
}

/**
 * Hook to fetch page fields by page ID
 * @param pageId - The page ID
 * @param enabled - Whether the query should be enabled
 * @returns React Query result with page fields data
 */
export function usePageFields(pageId: number | null, enabled: boolean = true) {
    return useQuery({
        queryKey: ['pageFields', pageId],
        queryFn: async () => {
            if (!pageId) throw new Error('Page ID is required');
            const data = await AdminApi.getPageFields(pageId);
            return data;
        },
        enabled: enabled && !!pageId,
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
    });
} 