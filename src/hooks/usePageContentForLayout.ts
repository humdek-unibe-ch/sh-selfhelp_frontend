/**
 * Custom hook for fetching page content in layout components.
 * This is a simplified version that doesn't depend on PageContentContext.
 * Uses the same cache key as usePageContent for data sharing.
 * 
 * @module hooks/usePageContentForLayout
 */

import { useQuery } from '@tanstack/react-query';
import { PageApi } from '../api/page.api';

/**
 * Hook for fetching page content in layout components.
 * @param {string} keyword - The unique identifier for the page content
 * @param {number} [languageId] - The language ID for localized content
 * @param {boolean} [enabled=true] - Whether to enable the query
 * @returns {Object} Object containing page content data and query state
 */
export function usePageContentForLayout(keyword: string, languageId?: number, enabled: boolean = true) {
    // Query configuration using React Query
    // Using the same cache key as usePageContent for data sharing
    const { 
        data, 
        isLoading, 
        isFetching,
        isSuccess,
        error 
    } = useQuery({
        queryKey: ['page-content', keyword, languageId || 'default'],
        queryFn: () => PageApi.getPageContent(keyword, languageId),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes to match usePageContent
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
        enabled: !!keyword && enabled, // Only run query if keyword is provided and enabled is true
        refetchOnWindowFocus: false, // Prevent refetch on window focus
        refetchOnMount: false, // Don't refetch on mount if data exists
        retry: 1, // Reduce retries to prevent loops
    });

    return {
        content: data,
        isLoading,
        isFetching,
        isSuccess,
        error
    };
} 