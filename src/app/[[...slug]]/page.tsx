/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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
import { notFound, redirect } from 'next/navigation';
import {
    getFrontendPageSeoSSR,
    getPageByKeywordSSRCached,
    getPageByKeywordSSRStatus,
    resolveLanguageSSR,
    resolvePreviewSSR,
    extractSsrPage,
} from '../_lib/server-fetch';
import type { IPageContent } from '../../shared';
import { MaintenanceClient } from '../MaintenanceClient';
import { MAINTENANCE_KEYWORD, hasRenderableMaintenancePage, isMaintenanceStatus } from '../maintenance';
import DynamicPageClient from './DynamicPageClient';
import { buildStaticFallbackPath, keywordFromSlug } from './slug-routing';

/**
 * Returns true when the page should fall back to its static route.
 *
 * Prefers the BE-computed `should_fallback` flag (set when the page is
 * missing its required functional section). Falls back to the old
 * zero-sections check when the flag is absent (older BE versions).
 */
function shouldFallback(page: (IPageContent & { should_fallback?: boolean }) | null): boolean {
    if (!page) return true;
    if (typeof page.should_fallback === 'boolean') return page.should_fallback;
    const sections = Array.isArray(page?.sections) ? page.sections : [];
    return sections.length === 0;
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

    const [envelope, navSeo] = await Promise.all([
        getPageByKeywordSSRCached(keyword, languageId, preview),
        getFrontendPageSeoSSR(keyword, languageId),
    ]);

    const page = extractSsrPage(envelope);

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

    const { status, data: envelope } = await getPageByKeywordSSRStatus(keyword, languageId, preview);

    // Instance in maintenance: Symfony returns a clean 503 for normal page
    // traffic while keeping the `maintenance` page reachable. Render the styled
    // seeded maintenance page (with the operator's `{{system.maintenance_message}}`),
    // falling back to the hardcoded client page when it is missing/unreachable.
    if (isMaintenanceStatus(status)) {
        const maintenanceEnvelope = await getPageByKeywordSSRCached(
            MAINTENANCE_KEYWORD,
            languageId,
            preview
        );
        const maintenancePage = extractSsrPage(maintenanceEnvelope);
        if (hasRenderableMaintenancePage(maintenancePage)) {
            return (
                <DynamicPageClient keyword={MAINTENANCE_KEYWORD} initialPageId={maintenancePage.id} />
            );
        }
        return <MaintenanceClient />;
    }

    const page = extractSsrPage(envelope);

    const fallbackPath = buildStaticFallbackPath(keyword, slug);
    if (fallbackPath && shouldFallback(page)) {
        redirect(fallbackPath);
    }

    if (!page) {
        notFound();
    }

    return <DynamicPageClient keyword={keyword} initialPageId={page.id} />;
}
