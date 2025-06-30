/**
 * Custom hook for managing page content data.
 * Provides functionality to fetch and manage page content using React Query,
 * while synchronizing the data with a global context.
 * 
 * @module hooks/usePageContent
 */

import { useQuery } from '@tanstack/react-query';
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

    // Query configuration using React Query
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
        enabled: !!keyword && !!currentLanguageId,
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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