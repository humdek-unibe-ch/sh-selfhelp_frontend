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
    resolveLanguageSSR,
    resolvePreviewSSR,
} from '../_lib/server-fetch';
import DynamicPageClient from './DynamicPageClient';

const HOME_KEYWORD = 'home';

/**
 * Static-route fallbacks for the auth-critical CMS keywords.
 *
 * If the CMS payload for one of these keywords is missing, errored, or has
 * zero rendered sections, we redirect to the equivalent hardcoded React
 * route instead of showing `notFound()` or an empty page. Without this
 * escape hatch an operator who accidentally deletes every section on the
 * `login` page (or runs the install before the seeding migration is
 * applied) would be permanently locked out — there is no way back into
 * the admin to fix the content if you cannot reach the login screen.
 *
 * `logout` is handled by `useAppNavigation` as a pure action, so it is
 * intentionally absent here. `profile-link` is the avatar dropdown label
 * and never produces a route.
 */
const STATIC_FALLBACK_BY_KEYWORD: Record<string, string> = {
    login: '/auth/login',
    'two-factor-authentication': '/auth/two-factor-authentication',
};

/**
 * URL → page keyword aliases.
 *
 * Some system pages keep a "kebab-case URL" (`/no-access`, `/no-access-guest`,
 * `/reset`) but their CMS keyword uses underscores (`no_access`,
 * `no_access_guest`, `reset_password`) — that's the historical SelfHelp
 * convention and we do not want to rename keywords that are referenced
 * from hooks, ACL rows, plugin code, and existing migrations.
 *
 * The slug catch-all therefore consults this map BEFORE falling back to
 * the literal `slug.join('/')` so the API lookup uses the canonical
 * keyword.
 */
const SLUG_TO_KEYWORD: Record<string, string> = {
    'no-access': 'no_access',
    'no-access-guest': 'no_access_guest',
    reset: 'reset_password',
};

/**
 * Resolve a CMS page keyword from the dynamic slug.
 *
 *   `[]`                        → `home`
 *   `['validate', uid, token]`  → `validate` (the uid + token are read by
 *                                 `ValidateStyle` from `params.slug`)
 *   `['no-access']`             → `no_access` (keyword alias)
 *   anything else               → `slug.join('/')`
 */
function keywordFromSlug(slug: string[] | undefined): string {
    if (!slug || slug.length === 0) return HOME_KEYWORD;

    // Parameterised system page: `/validate/<uid>/<token>` resolves to the
    // `validate` CMS page; the `ValidateStyle` component reads the trailing
    // path parts from `params.slug` itself.
    if (slug[0] === 'validate' && slug.length === 3) {
        return 'validate';
    }

    const joined = slug.join('/');
    return SLUG_TO_KEYWORD[joined] ?? joined;
}

/**
 * Returns true when `page` cannot be rendered as a CMS page — i.e. the
 * envelope is null/undefined or the page carries no sections at all. We
 * treat both as "CMS payload is empty" so the fallback redirect kicks in
 * symmetrically whether the row was never seeded or all sections were
 * removed by an admin.
 */
function isPagePayloadEmpty(page: any): boolean {
    if (!page) return true;
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

    // Auth-critical fallback: if the CMS payload is empty for `login` or
    // `two-factor-authentication`, redirect to the static React route so
    // operators are never locked out of their own install. See
    // `STATIC_FALLBACK_BY_KEYWORD` for the rationale.
    if (
        Object.prototype.hasOwnProperty.call(STATIC_FALLBACK_BY_KEYWORD, keyword) &&
        isPagePayloadEmpty(page)
    ) {
        redirect(STATIC_FALLBACK_BY_KEYWORD[keyword]);
    }

    if (!page) {
        notFound();
    }

    return <DynamicPageClient keyword={keyword} initialPageId={page.id} />;
}
