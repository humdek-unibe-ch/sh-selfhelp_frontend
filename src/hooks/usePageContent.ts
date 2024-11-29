/**
 * Custom hook for managing page content data.
 * Provides functionality to fetch and manage page content using React Query,
 * while synchronizing the data with a global context.
 * 
 * @module hooks/usePageContent
 */

import { useQuery } from '@tanstack/react-query';
import { PageService } from '@/services/page.service';
import { useContext, useEffect } from 'react';
import { PageContentContext } from '@/contexts/PageContentContext';

/**
 * Hook for fetching and managing page content.
 * @param {string} keyword - The unique identifier for the page content
 * @param {boolean} [enabled=true] - Whether to enable the query
 * @throws {Error} When used outside of PageContentProvider
 * @returns {Object} Object containing page content data and query state
 */
export function usePageContent(keyword: string, enabled: boolean = true) {
    const context = useContext(PageContentContext);
    if (!context) {
        throw new Error('usePageContent must be used within a PageContentProvider');
    }
    const { setPageContent } = context;

    // Query configuration using React Query
    const { data, isLoading, error } = useQuery({
        queryKey: ['page-content', keyword],
        queryFn: () => PageService.getPageContent(keyword),
        staleTime: 1000, // Cache for 1 second
        enabled: !!keyword && enabled, // Only run query if keyword is provided and enabled is true
    });

    // Sync React Query data with context
    useEffect(() => {
        if (data) {
            setPageContent(data);
        }
    }, [data, setPageContent]);

    return {
        content: data,
        isLoading,
        error
    };
}