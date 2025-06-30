/**
 * React Query hooks for fetching page sections and fields
 * Provides separate hooks for better performance and caching
 * 
 * @module hooks/usePageDetails
 */

import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '../api/admin.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { debug } from '../utils/debug-logger';

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
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
    });
} 