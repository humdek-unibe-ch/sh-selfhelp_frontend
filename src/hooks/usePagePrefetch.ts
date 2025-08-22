/**
 * Custom hook for prefetching page content to enable instant navigation.
 * Provides functionality to prefetch page content when users hover over links,
 * ensuring smooth navigation without loading spinners.
 * 
 * @module hooks/usePagePrefetch
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { PageApi } from '../api/page.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useLanguageContext } from '../app/components/contexts/LanguageContext';

/**
 * Hook for prefetching page content to enable instant navigation.
 * This ensures that when users click on navigation links, the content
 * is already available in the cache, eliminating loading spinners.
 * 
 * @returns {Object} Object containing prefetch functions
 */
export function usePagePrefetch() {
    const queryClient = useQueryClient();
    const { currentLanguageId } = useLanguageContext();
    
    /**
     * Prefetches page content for a specific page ID.
     * This is typically called on hover events for navigation links.
     * 
     * @param {number} pageId - The page ID to prefetch
     */
    const prefetchPage = useCallback(async (pageId: number) => {
        if (!pageId || !currentLanguageId) return;
        
        const queryKey = ['page-content', pageId, currentLanguageId];
        
        // Check if we already have this data in cache
        const existingData = queryClient.getQueryData(queryKey);
        if (existingData) {
            return; // Data already cached, no need to prefetch
        }
        
        // Prefetch the page content
        await queryClient.prefetchQuery({
            queryKey,
            queryFn: () => PageApi.getPageContent(pageId, currentLanguageId),
            staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
            gcTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.gcTime,
        });
    }, [queryClient, currentLanguageId]);
    
    /**
     * Prefetches multiple pages at once.
     * Useful for prefetching all navigation pages on app load.
     * 
     * @param {number[]} pageIds - Array of page IDs to prefetch
     */
    const prefetchPages = useCallback(async (pageIds: number[]) => {
        if (!currentLanguageId) return;
        
        const prefetchPromises = pageIds.map(pageId => prefetchPage(pageId));
        await Promise.all(prefetchPromises);
    }, [prefetchPage, currentLanguageId]);
    
    /**
     * Creates a hover handler that prefetches page content.
     * This can be attached to navigation links to enable instant navigation.
     * 
     * @param {number} pageId - The page ID to prefetch on hover
     * @returns {Function} Hover event handler
     */
    const createHoverPrefetch = useCallback((pageId: number) => {
        return () => prefetchPage(pageId);
    }, [prefetchPage]);
    
    return {
        prefetchPage,
        prefetchPages,
        createHoverPrefetch,
    };
}
