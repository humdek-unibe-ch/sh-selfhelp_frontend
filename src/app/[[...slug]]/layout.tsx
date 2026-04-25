/**
 * Slug route layout — Server Component.
 *
 * Runs on every public `/*` request, including the homepage. Responsibilities:
 *   1. Resolve the keyword from the URL params (fallback to the `home` keyword
 *      the backend uses for the landing page).
 *   2. Resolve the active language via `resolveLanguageSSR` (live DB list,
 *      no hardcoded locale→id map).
 *   3. Prefetch navigation + page content on the server and dehydrate them
 *      into a `HydrationBoundary`, so the client renders immediately without
 *      the old two-step nav → id → content waterfall.
 *   4. Use `is_headless` from the prefetched page to decide whether to
 *      render the header + footer. That decision lives on the server so the
 *      shell does not flash on headless pages.
 */

import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';
import {
    getFrontendPagesSSR,
    getPageByKeywordSSRCached,
    resolveLanguageSSR,
    resolvePreviewSSR,
} from '../_lib/server-fetch';
import SlugShell from './SlugLayout/SlugShell';
import { WebsiteHeader } from '../components/frontend/layout/WebsiteHeader';
import { WebsiteFooter } from '../components/frontend/layout/WebsiteFooter/WebsiteFooter';

/** Backend keyword used for the landing page (matches Symfony's `home` page). */
const HOME_KEYWORD = 'home';

function keywordFromSlug(slug: string[] | undefined): string {
    if (!slug || slug.length === 0) return HOME_KEYWORD;
    return slug.join('/');
}

export default async function SlugRouteLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug?: string[] }>;
}) {
    const { slug } = await params;
    const keyword = keywordFromSlug(slug);
    const [{ id: languageId }, preview] = await Promise.all([
        resolveLanguageSSR(),
        resolvePreviewSSR(),
    ]);

    const queryClient = new QueryClient({
        defaultOptions: REACT_QUERY_CONFIG.DEFAULT_OPTIONS,
    });

    // Prefetch the page content under the SAME cache key the client hook
    // will read (`['page-by-keyword', keyword, languageId, preview]`). The
    // preview flag is resolved from `sh_preview` on the server, so admins
    // toggling preview mode see a single request per navigation instead of
    // published-then-preview double fetches.
    const [navEnvelope, pageEnvelope] = await Promise.all([
        queryClient.prefetchQuery({
            queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FRONTEND_PAGES(languageId),
            queryFn: async () => {
                const raw = await getFrontendPagesSSR(languageId);
                // Store the RAW flat pages list (envelope unwrapped). The
                // client-side `useAppNavigation` hook applies its own
                // `transformPageData` via `select` on top of this shape; we
                // deliberately do NOT pre-transform here because `select`
                // must run on both SSR-hydrated and freshly-fetched data to
                // stay consistent.
                const pages = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
                return pages;
            },
        }).then(() => queryClient.getQueryData(REACT_QUERY_CONFIG.QUERY_KEYS.FRONTEND_PAGES(languageId))),
        queryClient.prefetchQuery({
            queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD(keyword, languageId, preview),
            queryFn: async () => {
                const raw = await getPageByKeywordSSRCached(keyword, languageId, preview);
                return raw?.data?.page ?? raw?.data ?? null;
            },
        }).then(() =>
            queryClient.getQueryData(REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD(keyword, languageId, preview))
        ),
    ]);

    // Pull is_headless off the page payload so the shell renders without the
    // header/footer flash. Fall back to false when prefetch failed — the
    // client will sort it out once the fetch retries.
    const page = (pageEnvelope as any) ?? null;
    const isHeadless = Boolean(page?.is_headless);

    // Touch navEnvelope so TypeScript doesn't prune the prefetch.
    void navEnvelope;

    const dehydratedState = dehydrate(queryClient);

    // The header is a Server Component that resolves the menu HTML on the
    // server (`getMenuPagesSSR` shares the cached `/pages/language/{id}`
    // round-trip with the prefetch above). Passing it as a slot to the
    // `'use client'` `SlugShell` is what lets the menu items appear in the
    // very first painted frame — no flash, no client-side waterfall.
    return (
        <HydrationBoundary state={dehydratedState}>
            <SlugShell
                isHeadless={isHeadless}
                header={!isHeadless ? <WebsiteHeader /> : undefined}
                footer={!isHeadless ? <WebsiteFooter /> : undefined}
            >
                {children}
            </SlugShell>
        </HydrationBoundary>
    );
}

// The slug layout itself has no metadata — each page segment provides its own.
