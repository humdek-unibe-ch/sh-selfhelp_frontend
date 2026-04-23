/**
 * Prefetches page content into React Query so hovering over a nav link
 * warms the exact cache key that a subsequent navigation will read —
 * `['page-by-keyword', keyword, languageId, 'published']`.
 *
 * NOTE: prior versions keyed the prefetch by `pageId` and the old
 * `['page-content', pageId, languageId]` entry, which the page renderer
 * never consumed — so the "instant navigation" promise was silently broken.
 * This implementation shares the same key used by the SSR layout prefetch
 * and the client `usePageContentByKeyword` / `usePageContentValue` hooks,
 * guaranteeing the warmed entry is the one that actually gets rendered.
 *
 * @module hooks/usePagePrefetch
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { PageApi } from '../api/page.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useLanguageContext } from '../app/components/contexts/LanguageContext';

export function usePagePrefetch() {
    const queryClient = useQueryClient();
    const { currentLanguageId } = useLanguageContext();

    /**
     * Prefetches page content for a keyword at the current language.
     * Skips the network call when the cache already holds (non-stale) data.
     */
    const prefetchPage = useCallback(async (keyword: string) => {
        if (!keyword || !currentLanguageId) return;

        const queryKey = REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD(
            keyword,
            currentLanguageId,
            false
        );

        if (queryClient.getQueryData(queryKey)) {
            return;
        }

        await queryClient.prefetchQuery({
            queryKey,
            queryFn: () => PageApi.getPageByKeyword(keyword, currentLanguageId, false),
            staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.PAGE_CONTENT.staleTime,
            gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.PAGE_CONTENT.gcTime,
        });
    }, [queryClient, currentLanguageId]);

    /** Batch-prefetch multiple pages by keyword. */
    const prefetchPages = useCallback(async (keywords: string[]) => {
        if (!currentLanguageId) return;
        await Promise.all(keywords.map((k) => prefetchPage(k)));
    }, [prefetchPage, currentLanguageId]);

    /**
     * Returns a zero-arg hover handler that prefetches the given keyword's
     * page content. Memoised per keyword so attaching the handler doesn't
     * re-create listeners on every render.
     */
    const createHoverPrefetch = useCallback((keyword: string) => {
        return () => prefetchPage(keyword);
    }, [prefetchPage]);

    return {
        prefetchPage,
        prefetchPages,
        createHoverPrefetch,
    };
}
