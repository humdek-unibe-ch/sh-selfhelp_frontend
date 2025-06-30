/**
 * Custom hook for fetching page content in layout components.
 * This is a simplified version that doesn't depend on PageContentContext.
 * Uses the same cache key as usePageContent for data sharing.
 * 
 * @module hooks/usePageContentForLayout
 */

import { useQuery } from '@tanstack/react-query';
import { PageApi } from '../api/page.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useLanguageContext } from '../app/contexts/LanguageContext';
import type { IPageContent } from '../types/responses/frontend/frontend.types';

/**
 * Hook for fetching page content in layout components.
 * @param {string} keyword - The unique identifier for the page content
 * @param {boolean} [enabled=true] - Whether to enable the query
 * @returns {Object} Object containing page content data and query state
 */
export function usePageContentForLayout(keyword: string, enabled: boolean = true) {
    const { currentLanguageId } = useLanguageContext();
    
    // Query configuration using React Query
    // Using the same cache key as usePageContent for data sharing
    const { 
        data, 
        isLoading, 
        isFetching,
        isSuccess,
        error 
    } = useQuery<IPageContent>({
        queryKey: ['page-content-layout', keyword, currentLanguageId],
        queryFn: () => PageApi.getPageContent(keyword, currentLanguageId),
        enabled: !!keyword && !!currentLanguageId,
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    return {
        content: data,
        isLoading,
        isFetching,
        isSuccess,
        error
    };
} 