/**
 * Custom hook for managing page content data.
 * Provides functionality to fetch and manage page content using React Query,
 * with optional context synchronization for layout components.
 *
 * @module hooks/usePageContent
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { PageApi } from '../api/page.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useEffect, useRef } from 'react';
import { usePageContentContext } from '../app/components/contexts/PageContentContext';
import { useLanguageContext } from '../app/components/contexts/LanguageContext';
import { IPageContent } from '../types/common/pages.type';

interface IUsePageContentOptions {
  /** Whether to enable the query */
  enabled?: boolean;
  /** Whether this is for layout components (affects context sync and caching) */
  forLayout?: boolean;
  /** Custom query key prefix */
  queryKeyPrefix?: string;
  /** Language ID override */
  languageId?: number;
  /** Force draft preview mode (ignores published versions) */
  preview?: boolean;
}

/**
 * Hook for fetching and managing page content.
 * @param {number | null} pageId - The unique identifier for the page content
 * @param {IUsePageContentOptions} [options] - Configuration options
 * @throws {Error} When used outside of PageContentProvider and forLayout=false
 * @returns {Object} Object containing page content data and query state
 *
 * @note When forLayout=true, this hook does not require PageContentProvider context
 * and can be used in layout components safely.
 */
export function usePageContent(pageId: number | null, options: IUsePageContentOptions = {}) {
    const { enabled = true, forLayout = false, queryKeyPrefix, languageId: providedLanguageId, preview = false } = options;

    // Always call the context hook, but only use it for non-layout usage
    const contextHooks = usePageContentContext();
    const { setPageContent } = forLayout ? { setPageContent: () => {} } : contextHooks;

    const { currentLanguageId } = useLanguageContext();
    const lastDataRef = useRef<any>(null);

    // Use provided language ID or fall back to current language from context
    const languageIdToUse = providedLanguageId || currentLanguageId;

    // Determine query key based on usage context - include preview in key to separate caches
    // IMPORTANT: Use the same base key for both layout and page to share the cache and avoid duplicate requests
    const queryKey = queryKeyPrefix
        ? [queryKeyPrefix, pageId, languageIdToUse, preview ? 'preview' : 'published']
        : ['page-content', pageId, languageIdToUse, preview ? 'preview' : 'published'];

    // Determine cache configuration based on usage
    const gcTime = forLayout
        ? REACT_QUERY_CONFIG.CACHE.gcTime
        : REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.gcTime;

    // Query configuration using React Query with aggressive caching for smooth navigation
    const {
        data,
        isLoading,
        isFetching,
        isSuccess,
        error,
        isPlaceholderData
    } = useQuery<IPageContent>({
        queryKey,
        queryFn: () => PageApi.getPageContent(pageId!, languageIdToUse, preview),
        enabled: !!pageId && !!languageIdToUse && enabled,
        staleTime: preview ? 0 : REACT_QUERY_CONFIG.CACHE.staleTime, // No cache for preview mode
        gcTime: preview ? 0 : REACT_QUERY_CONFIG.CACHE.gcTime, // No cache for preview mode
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        placeholderData: forLayout ? undefined : keepPreviousData, // Only use for main content, not layout
        refetchOnWindowFocus: preview ? true : (forLayout ? undefined : false), // Always refetch preview
        refetchOnMount: preview ? true : (forLayout ? undefined : false), // Always refetch preview
    });

    // Sync React Query data with context only when data actually changes (only for main content)
    useEffect(() => {
        if (!forLayout && data && data !== lastDataRef.current) {
            lastDataRef.current = data;
            setPageContent(data);
        }
    }, [data, setPageContent, forLayout]);

    return {
        content: data,
        isLoading,
        isFetching,
        isSuccess,
        error,
        isPlaceholderData: forLayout ? false : isPlaceholderData // Layout doesn't use placeholder data
    };
}