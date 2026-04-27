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

import { createContext, useContext, useMemo, ReactNode } from 'react';

export interface IPageContextValue {
    keyword: string;
    languageId: number;
    pageId: number;
}

const PageContext = createContext<IPageContextValue | null>(null);

interface IPageContextProviderProps {
    keyword: string;
    languageId: number;
    pageId: number;
    children: ReactNode;
}

export function PageContextProvider({ keyword, languageId, pageId, children }: IPageContextProviderProps) {
    const value = useMemo<IPageContextValue>(
        () => ({ keyword, languageId, pageId }),
        [keyword, languageId, pageId]
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
