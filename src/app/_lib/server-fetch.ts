/**
 * Server-side fetch helpers.
 *
 * Used by Server Components (layouts, pages, `generateMetadata`) to call
 * Symfony directly — bypassing the `/api/*` BFF proxy because we already run
 * in the trusted Node process. Handles attaching the current user's access
 * token from the `sh_auth` cookie so permission-aware endpoints return the
 * correct data during SSR.
 *
 * Per-user / personalised payloads use `cache: 'no-store'`; globally
 * cacheable data (e.g. `/languages`) uses Next's `revalidate` TTL so hot
 * paths don't re-hit Symfony on every request.
 */

import { cache } from 'react';
import { cookies } from 'next/headers';
import type { MantineColorScheme } from '@mantine/core';
import {
    AUTH_COOKIE,
    COLOR_SCHEME_COOKIE,
    LANG_COOKIE,
    LOCALE_HINT_COOKIE,
    PREVIEW_COOKIE,
    SYMFONY_API_PREFIX,
    SYMFONY_INTERNAL_URL,
} from '../../config/server.config';
import {
    selectMenuPages,
    selectProfilePages,
    transformNavigationPages,
} from '../../utils/navigation.utils';
import type { IPageItem } from '../../types/common/pages.type';

/** SSR cache lifetime for `/languages` in seconds. */
const LANGUAGES_REVALIDATE_SECONDS = 300;

async function authHeaders(): Promise<HeadersInit> {
    const jar = await cookies();
    const token = jar.get(AUTH_COOKIE)?.value;
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Client-Type': 'web-ssr',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
}

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T | null> {
    const url = `${SYMFONY_INTERNAL_URL}${SYMFONY_API_PREFIX}${path}`;
    try {
        const res = await fetch(url, {
            cache: 'no-store',
            ...init,
            headers: { ...(await authHeaders()), ...(init.headers || {}) },
        });
        if (!res.ok) return null;
        return (await res.json()) as T;
    } catch {
        return null;
    }
}

/**
 * Fetch navigation (frontend pages) for the given language. Returned shape
 * matches the public `/pages/language/{id}` endpoint, which is also what the
 * React Query `['frontend-pages', languageId]` entry expects so the client
 * can hydrate without a refetch.
 *
 * Wrapped in `cache()` so the slug layout prefetch and `generateMetadata`
 * share one round-trip per request.
 */
export const getFrontendPagesSSR = cache(async (languageId: number): Promise<any | null> => {
    return fetchJson(`/pages/language/${languageId}`);
});

/**
 * Resolve the server-rendered top-level menu items for a given language.
 *
 * Performs the same transform + filter as `useAppNavigation`'s `select`
 * (via the shared helpers in `utils/navigation.utils`) so the HTML emitted
 * by the Server Component header matches the post-hydration client render
 * char-for-char. Wrapped in `cache()` so the slug layout, the SSR header,
 * and `generateMetadata` all share a single `/pages/language/{id}` round-trip
 * per request.
 *
 * Returns an empty array when the upstream call fails — the client menu
 * still mounts and the React Query refetch will fill in the gap.
 */
export const getMenuPagesSSR = cache(async (languageId: number): Promise<IPageItem[]> => {
    const raw = await getFrontendPagesSSR(languageId);
    const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    if (list.length === 0) return [];
    const transformed = transformNavigationPages(list);
    return selectMenuPages(transformed);
});

/**
 * Resolve the server-rendered profile-link entries for a given language.
 *
 * Used by the Server Component `WebsiteHeader` to seed the auth button's
 * profile dropdown title (e.g. "Profil" in German) so the SSR HTML and
 * the first client render do not flash the hardcoded English `'Profile'`
 * fallback while React Query rehydrates.
 *
 * Anonymous visitors get an empty list because the backend only returns
 * the system `profile-link` page when the request carries an
 * authenticated bearer token — which is exactly what we want, since the
 * auth button shows `Login` for them and never reads `profilePages`.
 *
 * Wrapped in `cache()` so the slug layout, SSR header and metadata calls
 * share the same `/pages/language/{id}` round-trip per request.
 */
export const getProfilePagesSSR = cache(async (languageId: number): Promise<IPageItem[]> => {
    const raw = await getFrontendPagesSSR(languageId);
    const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    if (list.length === 0) return [];
    const transformed = transformNavigationPages(list);
    return selectProfilePages(transformed);
});

/**
 * Resolve a page's display title + description for `generateMetadata` as a
 * fallback when the page content payload itself does not carry them.
 *
 * Since the backend switched to returning translated `title` / `description`
 * directly on the `/pages/by-keyword/{keyword}` payload, this helper is a
 * secondary safety net — it reads the SSR-cached `frontend-pages` list and
 * finds the keyword (including nested children) so we can still render a
 * sensible `<title>` even if the content endpoint is briefly unavailable or
 * the per-page translation hasn't been seeded yet.
 *
 * Returns `{ title: null, description: null }` when no match exists; the
 * caller then falls back to Next's default metadata template.
 */
export async function getFrontendPageSeoSSR(
    keyword: string,
    languageId: number
): Promise<{ title: string | null; description: string | null }> {
    const empty = { title: null, description: null };
    const raw = await getFrontendPagesSSR(languageId);
    const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    if (list.length === 0) return empty;

    const find = (nodes: any[]): { title: string | null; description: string | null } | null => {
        for (const node of nodes) {
            if (!node) continue;
            if (node.keyword === keyword) {
                const title = typeof node.title === 'string' && node.title.trim() ? node.title.trim() : null;
                const description =
                    typeof node.description === 'string' && node.description.trim()
                        ? node.description.trim()
                        : null;
                return { title, description };
            }
            if (Array.isArray(node.children) && node.children.length > 0) {
                const hit = find(node.children);
                if (hit) return hit;
            }
        }
        return null;
    };

    return find(list) ?? empty;
}

/**
 * Fetch a page's full content by keyword. Module-private so all consumers
 * go through `getPageByKeywordSSRCached` and benefit from the per-request
 * deduplication.
 */
async function getPageByKeywordSSR(
    keyword: string,
    languageId: number,
    preview = false
): Promise<any | null> {
    const params = new URLSearchParams({ language_id: String(languageId) });
    if (preview) params.set('preview', '1');
    return fetchJson(`/pages/by-keyword/${encodeURIComponent(keyword)}?${params.toString()}`);
}

/**
 * Fetch the full admin pages tree for the current authenticated user. Used
 * by the admin SSR layout to prefill the navbar so the admin console doesn't
 * need to flash an empty tree on first paint.
 */
export async function getAdminPagesSSR(): Promise<any | null> {
    return fetchJson(`/admin/pages`);
}

/**
 * Fetch the admin lookups table. The response rarely changes so it ships at
 * the `LOOKUPS` cache tier (30 m stale / 1 h gc); prefetching on the admin
 * shell boot means inspector / form components get instant dropdown data
 * without a client round-trip.
 */
export async function getAdminLookupsSSR(): Promise<any | null> {
    return fetchJson(`/admin/lookups`);
}

/**
 * Fetch the current authenticated user's profile + ACL version.
 *
 * Wrapped in `cache()` so `ServerProviders` (which seeds `['user-data']`
 * for every render that has an `sh_auth` cookie) and `admin/layout.tsx`
 * (which uses the same payload to gate access via redirect) share a single
 * Symfony round-trip per request.
 */
export const getAuthMeSSR = cache(async (): Promise<any | null> => {
    return fetchJson(`/auth/user-data`);
});

/**
 * Fetch the public languages list. Languages are the source of truth for
 * locale → id mapping (the `languages` table is user-editable) so we must
 * resolve the user's preferred language against this list rather than a
 * hardcoded map.
 *
 * Cached on the Next.js data cache for `LANGUAGES_REVALIDATE_SECONDS` and
 * wrapped in React's `cache()` so multiple calls inside a single request
 * (root layout + slug layout + `ServerProviders`) share one hit. Admin
 * language CRUD mutations invalidate the client-side React Query cache
 * immediately; SSR renders naturally pick up the new list within the TTL
 * window.
 */
export const getPublicLanguagesSSR = cache(async (): Promise<any[] | null> => {
    const raw = await fetchJson<any>(`/languages`, {
        cache: 'force-cache',
        next: { revalidate: LANGUAGES_REVALIDATE_SECONDS },
    } as any);
    if (!raw) return null;
    const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : null;
    return list;
});

/**
 * Resolve the active language for an SSR request.
 *
 * Priority:
 *   1. Numeric `sh_lang` cookie, *if* it refers to a language still present
 *      in the languages list (defends against renames/removals).
 *   2. Locale string hint cookie `sh_accept_locale` (written by the proxy
 *      from `Accept-Language`) matched against `language.locale` — exact
 *      match first, then language-prefix match (e.g. `en` matches `en-GB`).
 *   3. First language in the list (treated as the system default).
 *
 * Returns `{ id, locale, htmlLang }`. `htmlLang` is the locale's primary
 * subtag (e.g. `en` from `en-GB`) which is what the `<html lang>` attribute
 * should carry.
 */
export const resolveLanguageSSR = cache(async (): Promise<{
    id: number;
    locale: string;
    htmlLang: string;
    languages: any[];
}> => {
    const jar = await cookies();
    const languages = (await getPublicLanguagesSSR()) ?? [];

    const pickByLocale = (loc: string) => {
        const lower = loc.toLowerCase();
        const exact = languages.find((l) => String(l.locale || '').toLowerCase() === lower);
        if (exact) return exact;
        const prefix = lower.split('-')[0];
        return languages.find((l) => String(l.locale || '').toLowerCase().split('-')[0] === prefix);
    };

    let selected: any | undefined;

    const cookieId = jar.get(LANG_COOKIE)?.value;
    const parsedId = cookieId ? parseInt(cookieId, 10) : NaN;
    if (Number.isFinite(parsedId)) {
        selected = languages.find((l) => Number(l.id) === parsedId);
    }

    if (!selected) {
        const acceptLocale = jar.get(LOCALE_HINT_COOKIE)?.value;
        if (acceptLocale) selected = pickByLocale(acceptLocale);
    }

    if (!selected && languages.length > 0) {
        selected = languages[0];
    }

    if (!selected) {
        // Extreme fallback: no languages configured yet. Any downstream call
        // will likely fail, but return a sane shape so `<html>` still renders.
        return { id: 0, locale: 'en', htmlLang: 'en', languages: [] };
    }

    const locale = String(selected.locale || 'en');
    const htmlLang = locale.split('-')[0] || 'en';
    return { id: Number(selected.id), locale, htmlLang, languages };
});

/**
 * Deduplicated helper for fetching page content by keyword in a single
 * request. The same payload is consumed by `generateMetadata` (for SEO tags)
 * and the layout's React Query prefetch; without `cache()` they would hit
 * Symfony twice in a row.
 */
export const getPageByKeywordSSRCached = cache(
    async (keyword: string, languageId: number, preview = false): Promise<any | null> => {
        return getPageByKeywordSSR(keyword, languageId, preview);
    }
);

/**
 * Resolve whether the current request should be rendered in preview mode.
 *
 * Authoritative source: the `sh_preview` cookie written by
 * `PreviewModeProvider`. Any truthy value ("1", "true") counts; absent or
 * "0" means the published view. Keeping
 * the resolver in the same file as `resolveLanguageSSR` makes it obvious that
 * both are SSR-scoped request-derived flags, and lets Server Components
 * pick the right `preview=true|false` before prefetching page content — which
 * eliminates the published → preview double round-trip admins previously
 * saw on every page load.
 *
 * Wrapped in `cache()` so the slug layout prefetch, `generateMetadata`,
 * and the slug page body share a single cookie read per request.
 */
export const resolvePreviewSSR = cache(async (): Promise<boolean> => {
    const jar = await cookies();
    const raw = jar.get(PREVIEW_COOKIE)?.value;
    if (!raw) return false;
    // Accept only truthy literals; anything else (including '0' and '') is
    // treated as published. This matches the cookie writer, which either
    // sets '1' or clears the cookie outright.
    return raw === '1' || raw.toLowerCase() === 'true';
});

/**
 * Resolve the Mantine color-scheme choice for the current SSR request from
 * the `sh_color_scheme` cookie.
 *
 * - `'light'` / `'dark'`: explicit user choice → root layout sets
 *   `<html data-mantine-color-scheme="...">` directly so CSS picks the right
 *   tokens on the *first* painted frame (no white flash on dark reloads).
 * - `'auto'`: user chose "follow system". The server cannot read the client's
 *   `prefers-color-scheme` from a cookie, so the attribute is left unset and
 *   the pre-hydration bootstrap script (`/mantine-color-scheme.js`) computes
 *   it from `matchMedia` before React hydrates.
 * - absent cookie: defaults to `'auto'`, matching the historical behaviour.
 *
 * The browser-side counterpart (writing the cookie on user toggle) lives in
 * `cookieColorSchemeManager` — the same cookie is the single source of truth
 * for both server and client renders.
 */
export const resolveColorSchemeSSR = cache(async (): Promise<MantineColorScheme> => {
    const jar = await cookies();
    const raw = jar.get(COLOR_SCHEME_COOKIE)?.value;
    if (raw === 'light' || raw === 'dark' || raw === 'auto') return raw;
    return 'auto';
});
