/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { PageApi } from '../api/page.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useLanguageContext } from '../app/components/contexts/LanguageContext';
import { type IPageContent } from '../shared';

interface IUsePageContentByPathOptions {
    /** Override the language id from context — useful for explicit SSR prefetches. */
    languageId?: number;
    /** Request the draft/preview version. */
    preview?: boolean;
    /** Gate the fetch. Defaults to true when path + languageId are ready. */
    enabled?: boolean;
}

/**
 * Fetch a public page by its full URL PATH via the DB-driven `page_routes`
 * resolver (issue #30). The path-based sibling of
 * {@link import('./usePageContentByKeyword').usePageContentByKeyword}.
 *
 * ## Why path, not keyword
 * Parameterized public URLs (`/team/7`, `/team/8`) share one CMS keyword
 * (`team`) but render different records, so keying the cache by keyword alone
 * would cross-leak content between records. Keying by path keeps each record's
 * render isolated, and the returned page carries `route_params` (snake_case)
 * for the auth + entry styles.
 *
 * The cache slot lives UNDER the `['page-by-keyword', '__path__', ...]` prefix
 * so every existing public-content invalidation (form submit, page/section
 * edit, ACL rotation, language switch) and the language-changing spinner cover
 * it automatically (see `REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_PATH`).
 */
export function usePageContentByPath(path: string, options: IUsePageContentByPathOptions = {}) {
    const { currentLanguageId } = useLanguageContext();
    const languageId = options.languageId ?? currentLanguageId;
    const preview = options.preview ?? false;
    const enabled = (options.enabled ?? true) && Boolean(path) && Boolean(languageId);

    const query = useQuery<IPageContent>({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_PATH(path, languageId, preview),
        queryFn: () => PageApi.resolvePageByPath(path, languageId, preview),
        enabled,
        // Mirror usePageContentByKeyword: the SSR-hydrated payload is fresh for
        // the short PAGE_CONTENT window, so a published render never refetches on
        // mount; preview keeps refetch-on-mount so admins always see their draft.
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
