/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Minimal, immutable page identity context.
 *
 * Replaces the old PageContentContext shadow cache. We no longer copy the
 * page content into React state; the authoritative source is the React Query
 * cache. This provider just carries `(keyword, languageId, pageId)` so deeply
 * nested components can derive the current content via the
 * `usePageContentValue` hook — which reads the *same* cache key
 * (`['page-by-keyword', keyword, languageId, 'published']`) that the SSR
 * layout prefetches into, giving a true zero-refetch hydration path.
 *
 * `pageId` is kept on the context for components that need to perform
 * page-scoped mutations. It is NOT part of the React Query cache key.
 *
 * @module contexts/PageContext
 */

'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

export interface IPageContextValue {
    keyword: string;
    languageId: number;
    pageId: number;
    /**
     * The full public URL path this page was resolved from via the DB-driven
     * `page_routes` resolver (issue #30), e.g. `/reset/42/abc` or `/team/7`.
     * Present for slug pages resolved by path; `usePageContentValue` reads the
     * path-keyed cache when set so parameterized records never cross-leak.
     */
    path?: string | null;
    /**
     * Snake_case route params extracted from the matched public URL pattern
     * (`{ user_id, token }`, `{ record_id }`). Mirrors `page.route_params`;
     * exposed on the context so styles can read them without re-parsing the URL.
     */
    routeParams?: Record<string, string>;
}

const PageContext = createContext<IPageContextValue | null>(null);

interface IPageContextProviderProps {
    keyword: string;
    languageId: number;
    pageId: number;
    path?: string | null;
    routeParams?: Record<string, string>;
    children: ReactNode;
}

export function PageContextProvider({
    keyword,
    languageId,
    pageId,
    path = null,
    routeParams,
    children,
}: IPageContextProviderProps) {
    const routeParamsKey = routeParams ? JSON.stringify(routeParams) : '';
    const value = useMemo<IPageContextValue>(
        () => ({ keyword, languageId, pageId, path, routeParams }),
        // routeParams is a fresh object each render; key on its serialised form.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [keyword, languageId, pageId, path, routeParamsKey]
    );
    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
}

/**
 * Read the current page identity. Returns null if the caller is rendered
 * outside a page (e.g. 404 pages). Callers must handle the null case.
 */
export function usePageContext(): IPageContextValue | null {
    return useContext(PageContext);
}
