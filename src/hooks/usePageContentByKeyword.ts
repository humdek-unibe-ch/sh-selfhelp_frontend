'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { PageApi } from '../api/page.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useLanguageContext } from '../app/components/contexts/LanguageContext';
import { IPageContent } from '../types/common/pages.type';

interface IUsePageContentByKeywordOptions {
    /** Override the language id from context — useful for explicit SSR prefetches. */
    languageId?: number;
    /** Request the draft/preview version. */
    preview?: boolean;
    /** Gate the fetch. Defaults to true when keyword + languageId are ready. */
    enabled?: boolean;
}

/**
 * Fetch a public page by keyword. Keyed on the keyword so the SSR layout
 * can prefetch the same entry the client will mount, eliminating the
 * navigation → page-id waterfall on first paint.
 *
 * Replaces the legacy id-based `usePageContent` hook — that hook required
 * the navigation list to load first to translate keyword → id, which
 * forced a serial waterfall on every page load. Going through the
 * `/pages/by-keyword/{keyword}` endpoint lets SSR (`getPageByKeywordSSRCached`)
 * and the client mount the same query slot in parallel with navigation
 * fetching.
 */
export function usePageContentByKeyword(keyword: string, options: IUsePageContentByKeywordOptions = {}) {
    const { currentLanguageId } = useLanguageContext();
    const languageId = options.languageId ?? currentLanguageId;
    const preview = options.preview ?? false;
    const enabled = (options.enabled ?? true) && Boolean(keyword) && Boolean(languageId);

    const query = useQuery<IPageContent>({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD(keyword, languageId, preview),
        queryFn: () => PageApi.getPageByKeyword(keyword, languageId, preview),
        enabled,
        // Preview keeps the short `PAGE_CONTENT` stale window rather than 0
        // so the SSR-hydrated payload is considered fresh for a second after
        // hydration. Without this, `refetchOnMount: true` below refires the
        // request the moment the client mounts, giving admins the same
        // request twice per navigation (the original published→preview double
        // fetch was only half the problem — the other half was a hydrated-
        // then-instantly-stale second call). Admin mutations still invalidate
        // the preview key explicitly so fresh edits never get stuck behind
        // this 1s window, and `refetchOnWindowFocus` keeps long-idle tabs
        // honest.
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.PAGE_CONTENT.staleTime,
        gcTime: preview ? 0 : REACT_QUERY_CONFIG.CACHE_TIERS.PAGE_CONTENT.gcTime,
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: preview,
        refetchOnMount: preview,
        retry: 1,
    });

    return {
        content: query.data ?? null,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isPlaceholderData: query.isPlaceholderData,
        error: query.error,
    };
}
