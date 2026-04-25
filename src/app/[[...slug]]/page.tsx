/**
 * Slug route page — Server Component.
 *
 * Uses the new `/pages/by-keyword/{keyword}` endpoint to fetch page content
 * in a single network round-trip. The same fetch backs both
 * `generateMetadata` (so the `<title>` is final at first paint and the tab
 * never flashes the default) and the initial React Query cache consumed by
 * the client child.
 *
 * Title / description resolution priority (per language):
 *   1. `page.title` / `page.description` from the content payload — the
 *      backend now resolves these from `pages_fields_translation` and
 *      returns them directly on the page object (primary source).
 *   2. Same fields from the `frontend-pages` nav list entry for this
 *      keyword — secondary safety net if the content payload is briefly
 *      unavailable or a translation row is missing.
 *   3. Next.js default metadata template (`'SelfHelp'` from
 *      `src/app/layout.tsx`) for title, `undefined` for description.
 *
 * The actual DOM output is produced by a small client component
 * (`DynamicPageClient`) because page content is interactive (forms, modals,
 * etc). The server half is intentionally thin.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
    getFrontendPageSeoSSR,
    getPageByKeywordSSRCached,
    resolveLanguageSSR,
    resolvePreviewSSR,
} from '../_lib/server-fetch';
import DynamicPageClient from './DynamicPageClient';

const HOME_KEYWORD = 'home';

function keywordFromSlug(slug: string[] | undefined): string {
    if (!slug || slug.length === 0) return HOME_KEYWORD;
    return slug.join('/');
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const keyword = keywordFromSlug(slug);
    const [{ id: languageId }, preview] = await Promise.all([
        resolveLanguageSSR(),
        resolvePreviewSSR(),
    ]);

    // Kick off both fetches in parallel. `getPageByKeywordSSRCached` is
    // React-`cache()`'d across the layout prefetch + this call + the page
    // body, so Symfony is still hit at most once per request. Pass the
    // preview flag from the cookie so admins in preview mode don't trigger
    // a second call after hydration.
    const [envelope, navSeo] = await Promise.all([
        getPageByKeywordSSRCached(keyword, languageId, preview),
        getFrontendPageSeoSSR(keyword, languageId),
    ]);

    const page = envelope?.data?.page ?? envelope?.data ?? null;

    // Prefer the payload fields (the backend now resolves translated
    // title/description per language and returns them on the page object).
    // Fall back to the nav list when an individual page row hasn't been
    // translated yet.
    const payloadTitle =
        typeof page?.title === 'string' && page.title.trim() ? page.title.trim() : null;
    const payloadDescription =
        typeof page?.description === 'string' && page.description.trim()
            ? page.description.trim()
            : null;

    const title = payloadTitle || navSeo.title || undefined;
    const description = payloadDescription || navSeo.description || undefined;
    const isHeadless: boolean = Boolean(page?.is_headless);

    return {
        // When `title` is undefined Next falls back to the root template
        // (see `src/app/layout.tsx`), keeping the tab consistent across
        // all public pages without our hardcoded default.
        title,
        description,
        robots: isHeadless ? { index: false, follow: false } : { index: true, follow: true },
        openGraph: title
            ? {
                  title,
                  description,
              }
            : undefined,
    };
}

export default async function SlugPage({
    params,
}: {
    params: Promise<{ slug?: string[] }>;
}) {
    const { slug } = await params;
    const keyword = keywordFromSlug(slug);
    const [{ id: languageId }, preview] = await Promise.all([
        resolveLanguageSSR(),
        resolvePreviewSSR(),
    ]);

    // Minimal server check: if the page does not exist, fall through to the
    // Next.js 404 handler. The heavy prefetch has already happened in the
    // layout; here we only need to know whether the page resolves. The
    // underlying call is React-`cache()`'d so `generateMetadata` + this call
    // + the layout prefetch all share one network hit.
    const envelope = await getPageByKeywordSSRCached(keyword, languageId, preview);
    const page = envelope?.data?.page ?? envelope?.data ?? null;
    if (!page) {
        notFound();
    }

    return <DynamicPageClient keyword={keyword} initialPageId={page.id} />;
}
