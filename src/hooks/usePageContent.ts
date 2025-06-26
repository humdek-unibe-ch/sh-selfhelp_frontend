/**
 * Custom hook for managing page content data.
 * Provides functionality to fetch and manage page content using React Query,
 * while synchronizing the data with a global context.
 * 
 * @module hooks/usePageContent
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { PageApi } from '../api/page.api';
import { useEffect, useRef } from 'react';
import { usePageContentContext } from '../app/contexts/PageContentContext';
import { useLanguageContext } from '../app/contexts/LanguageContext';

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

    // Query configuration using React Query
    const { 
        data, 
        isLoading, 
        isFetching,
        isSuccess,
        error,
        isPlaceholderData
    } = useQuery({
        queryKey: ['page-content', keyword, currentLanguageId],
        queryFn: () => PageApi.getPageContent(keyword, currentLanguageId),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes instead of 1 second
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
        enabled: !!keyword && enabled, // Only run query if keyword is provided and enabled is true
        refetchOnWindowFocus: false, // Prevent refetch on window focus
        refetchOnMount: true, // Allow refetch on mount to ensure fresh data for new pages
        retry: 1, // Reduce retries to prevent loops
        placeholderData: keepPreviousData, // Keep previous data during refetch for smooth transitions
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