/**
 * Custom hook for managing page content data.
 * Provides functionality to fetch and manage page content using React Query,
 * while synchronizing the data with a global context.
 * 
 * @module hooks/usePageContent
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { PageApi } from '../api/page.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useEffect, useRef } from 'react';
import { usePageContentContext } from '../app/contexts/PageContentContext';
import { useLanguageContext } from '../app/contexts/LanguageContext';
import type { IPageContent } from '../types/responses/frontend/frontend.types';

/**
 * Hook for fetching and managing page content.
 * @param {string} keyword - The unique identifier for the page content
 * @param {boolean} [enabled=true] - Whether to enable the query
 * @throws {Error} When used outside of PageContentProvider
 * @returns {Object} Object containing page content data and query state
 */
export function usePageContent(keyword: string, enabled: boolean = true) {
    const { setPageContent } = usePageContentContext();
    const { currentLanguageId } = useLanguageContext();
    const lastDataRef = useRef<any>(null);

    // Query configuration using React Query with aggressive caching for smooth navigation
    const { 
        data, 
        isLoading, 
        isFetching,
        isSuccess,
        error,
        isPlaceholderData
    } = useQuery<IPageContent>({
        queryKey: ['page-content', keyword, currentLanguageId],
        queryFn: () => PageApi.getPageContent(keyword, currentLanguageId),
        enabled: !!keyword && !!currentLanguageId && enabled,
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.gcTime, // Longer cache time for better navigation
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        placeholderData: keepPreviousData, // Keep previous data during refetch for smooth page transitions
        refetchOnWindowFocus: false, // Don't refetch when window gains focus
        refetchOnMount: false, // Don't refetch if we already have data
    });

    // Sync React Query data with context only when data actually changes
    useEffect(() => {
        if (data && data !== lastDataRef.current) {
            lastDataRef.current = data;
            setPageContent(data);
        }
    }, [data, setPageContent]);

    return {
        content: data,
        isLoading,
        isFetching,
        isSuccess,
        error,
        isPlaceholderData
    };
}