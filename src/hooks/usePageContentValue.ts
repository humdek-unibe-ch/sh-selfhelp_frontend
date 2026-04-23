/**
 * Thin selector hook that returns the current page's cached content from
 * React Query. Replaces direct consumption of PageContentContext.
 *
 * Reads from the same `['page-by-keyword', keyword, languageId, published]`
 * cache entry that:
 *   - the slug RSC layout seeds via `queryClient.prefetchQuery`, and
 *   - `usePageContentByKeyword` mounts into on the client.
 *
 * Using a shared cache key is what makes the SSR → hydration handoff free:
 * when `FormStyle`/`ValidateStyle` mount inside a hydrated page, they find
 * the content already in cache and never trigger a refetch.
 *
 * Callers that know the (keyword, languageId) pair can pass them in
 * explicitly (e.g. rendering a specific page fragment); otherwise the hook
 * resolves them from the surrounding `PageContext`.
 *
 * @module hooks/usePageContentValue
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { PageApi } from '../api/page.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { usePageContext } from '../app/components/contexts/PageContext';
import { IPageContent } from '../types/common/pages.type';

interface IUsePageContentValueOptions {
    keyword?: string | null;
    languageId?: number | null;
    preview?: boolean;
}

/**
 * Returns the currently-rendered page content (or null if no page is active).
 * Uses React Query structural sharing so components only re-render when their
 * specific slice of the page changes.
 */
export function usePageContentValue(options: IUsePageContentValueOptions = {}): IPageContent | null {
    const ctx = usePageContext();
    const keyword = options.keyword ?? ctx?.keyword ?? null;
    const languageId = options.languageId ?? ctx?.languageId ?? null;
    const preview = options.preview ?? false;

    const { data } = useQuery<IPageContent>({
        queryKey: keyword && languageId
            ? REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD(keyword, languageId, preview)
            : ['page-by-keyword', 'inactive'],
        queryFn: () => PageApi.getPageByKeyword(keyword as string, languageId as number, preview),
        enabled: Boolean(keyword && languageId),
        staleTime: preview ? 0 : REACT_QUERY_CONFIG.CACHE_TIERS.PAGE_CONTENT.staleTime,
        gcTime: preview ? 0 : REACT_QUERY_CONFIG.CACHE_TIERS.PAGE_CONTENT.gcTime,
    });

    return data ?? null;
}
