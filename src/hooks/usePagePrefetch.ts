/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Prefetches public page content into React Query so hovering a nav link
 * warms the exact cache key the next navigation reads —
 * `PAGE_BY_PATH` (`['page-by-keyword', '__path__', path, ...]`).
 *
 * Public pages resolve via `GET /pages/resolve` (issue #30). Prefetching by
 * keyword alone would warm a slot `DynamicPageClient` / SSR never read.
 *
 * @module hooks/usePagePrefetch
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { PageApi } from '../api/page.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useLanguageContext } from '../app/components/contexts/LanguageContext';

function normalizePublicPath(path: string): string {
    const trimmed = path.trim();
    if (trimmed === '' || trimmed === '/') {
        return '/';
    }
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function usePagePrefetch() {
    const queryClient = useQueryClient();
    const { currentLanguageId } = useLanguageContext();

    /**
     * Prefetches page content for a public URL path at the current language.
     * Skips the network call when the cache already holds data.
     */
    const prefetchPageByPath = useCallback(async (path: string) => {
        if (!path || !currentLanguageId) return;

        const normalized = normalizePublicPath(path);
        // Parameterized patterns (`/team/{record_id}`) are not resolvable until
        // a concrete segment is known — skip rather than 404 the preview cache.
        if (normalized.includes('{')) {
            return;
        }

        const queryKey = REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_PATH(
            normalized,
            currentLanguageId,
            false,
        );

        if (queryClient.getQueryData(queryKey)) {
            return;
        }

        await queryClient.prefetchQuery({
            queryKey,
            queryFn: () => PageApi.resolvePageByPath(normalized, currentLanguageId, false),
            staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.PAGE_CONTENT.staleTime,
            gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.PAGE_CONTENT.gcTime,
        });
    }, [queryClient, currentLanguageId]);

    /** Batch-prefetch multiple public paths. */
    const prefetchPagesByPath = useCallback(async (paths: string[]) => {
        if (!currentLanguageId) return;
        await Promise.all(paths.map((path) => prefetchPageByPath(path)));
    }, [prefetchPageByPath, currentLanguageId]);

    /**
     * Returns a zero-arg hover handler that prefetches the given public path.
     * Memoised per path so attaching the handler does not recreate listeners
     * on every render.
     */
    const createHoverPrefetch = useCallback((path: string) => {
        return () => {
            void prefetchPageByPath(path);
        };
    }, [prefetchPageByPath]);

    return {
        prefetchPageByPath,
        prefetchPagesByPath,
        createHoverPrefetch,
        /** @deprecated Use {@link prefetchPageByPath} — public cache is path-keyed. */
        prefetchPage: prefetchPageByPath,
        /** @deprecated Use {@link prefetchPagesByPath}. */
        prefetchPages: prefetchPagesByPath,
    };
}
