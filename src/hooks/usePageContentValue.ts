/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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
import { type IPageContent } from '../shared';

interface IUsePageContentValueOptions {
    keyword?: string | null;
    languageId?: number | null;
    preview?: boolean;
    /**
     * Resolve the content from the path-keyed cache (DB routing, issue #30)
     * instead of the keyword-keyed one. Defaults to the surrounding
     * `PageContext.path`. When a path is in play the value is read from the same
     * `PAGE_BY_PATH` slot the slug route hydrates, so parameterized records
     * (`/team/7`) never read another record's (`/team/8`) cached content.
     */
    path?: string | null;
}

/**
 * Returns the currently-rendered page content (or null if no page is active).
 * Uses React Query structural sharing so components only re-render when their
 * specific slice of the page changes.
 *
 * Reads the PATH-keyed cache when the active page was resolved by path (the
 * normal case for the public slug route after issue #30), else falls back to
 * the keyword-keyed cache. Both slots live under the same `page-by-keyword`
 * prefix, so invalidations cover either form.
 */
export function usePageContentValue(options: IUsePageContentValueOptions = {}): IPageContent | null {
    const ctx = usePageContext();
    const keyword = options.keyword ?? ctx?.keyword ?? null;
    const languageId = options.languageId ?? ctx?.languageId ?? null;
    const preview = options.preview ?? false;
    const path = options.path ?? ctx?.path ?? null;

    const usePath = Boolean(path && languageId);

    const { data } = useQuery<IPageContent>({
        queryKey: usePath
            ? REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_PATH(path as string, languageId as number, preview)
            : keyword && languageId
                ? REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD(keyword, languageId, preview)
                // Disabled-query sentinel (never fetched); reuse the registry prefix
                // so the 'page-by-keyword' literal lives in exactly one place.
                : [...REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL, 'inactive'],
        queryFn: usePath
            ? () => PageApi.resolvePageByPath(path as string, languageId as number, preview)
            : () => PageApi.getPageByKeyword(keyword as string, languageId as number, preview),
        enabled: usePath || Boolean(keyword && languageId),
        staleTime: preview ? 0 : REACT_QUERY_CONFIG.CACHE_TIERS.PAGE_CONTENT.staleTime,
        gcTime: preview ? 0 : REACT_QUERY_CONFIG.CACHE_TIERS.PAGE_CONTENT.gcTime,
    });

    return data ?? null;
}
