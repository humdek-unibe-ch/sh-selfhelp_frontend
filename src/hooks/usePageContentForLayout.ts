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
 * @param {number | null} pageId - The unique identifier for the page content
 * @param {boolean} [enabled=true] - Whether to enable the query
 * @returns {Object} Object containing page content data and query state
 */
export function usePageContentForLayout(pageId: number | null, enabled: boolean = true) {
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
        queryKey: ['page-content-layout', pageId, currentLanguageId],
        queryFn: () => PageApi.getPageContent(pageId!, currentLanguageId),
        enabled: !!pageId && !!currentLanguageId && enabled,
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
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