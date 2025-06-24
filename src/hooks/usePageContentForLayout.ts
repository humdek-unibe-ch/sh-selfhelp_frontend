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
 * @param {string} [language] - The language code for localized content
 * @param {boolean} [enabled=true] - Whether to enable the query
 * @returns {Object} Object containing page content data and query state
 */
export function usePageContentForLayout(keyword: string, language?: string, enabled: boolean = true) {
    // Query configuration using React Query
    // Using the same cache key as usePageContent for data sharing
    const { 
        data, 
        isLoading, 
        isFetching,
        isSuccess,
        error 
    } = useQuery({
        queryKey: ['page-content', keyword, language || 'default'],
        queryFn: () => PageApi.getPageContent(keyword, language),
        staleTime: 1000, // Cache for 1 second
        enabled: !!keyword && enabled, // Only run query if keyword is provided and enabled is true
    });

    return {
        content: data,
        isLoading,
        isFetching,
        isSuccess,
        error
    };
} 