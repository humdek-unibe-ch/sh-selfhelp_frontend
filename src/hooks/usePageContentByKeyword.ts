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
 * The hook mirrors `usePageContent` in semantics (shares the same cache
 * tier) but uses the `/pages/by-keyword/{keyword}` endpoint so we do not
 * depend on navigation being loaded first.
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
        staleTime: preview ? 0 : REACT_QUERY_CONFIG.CACHE_TIERS.PAGE_CONTENT.staleTime,
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
