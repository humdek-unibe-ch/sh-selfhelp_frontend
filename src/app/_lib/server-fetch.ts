/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Server-side fetch helpers.
 *
 * Used by Server Components (layouts, pages, `generateMetadata`) to call
 * Symfony directly — bypassing the `/api/*` BFF proxy because we already
 * run in the trusted Node process. Handles attaching the current user's
 * access token from the cookies so permission-aware endpoints return the
 * correct data during SSR.
 *
 * ## Impersonation rule (must match `proxy.ts::pickUpstreamToken`)
 *
 * When `sh_impersonate` is present we use it for ANY upstream call that
 * is NOT a session-lifecycle endpoint. That covers:
 *
 *   - `/pages/*`              → render the public site as the target,
 *   - `/lookups`              → reference data the impersonated profile
 *                                page actually needs,
 *   - `/auth/user-data`       → "who am I right now?" must reflect the
 *                                impersonated identity, otherwise SSR
 *                                hydrates as the admin while the client
 *                                fetches as the target → mismatched UI,
 *   - `/auth/events`          → Mercure subscriber JWT must be minted
 *                                for the impersonated identity.
 *
 * The exclusion list (`isAdminSessionRoute`) covers the routes that
 * operate on the *admin's session itself* — login, refresh, logout,
 * 2FA, set-language. Those always run as the original admin so the
 * admin can stop impersonating cleanly even if the impersonation JWT
 * has expired or been blacklisted.
 *
 * Per-user / personalised payloads use `cache: 'no-store'`; globally
 * cacheable data (e.g. `/languages`) uses Next's `revalidate` TTL so
 * hot paths don't re-hit Symfony on every request.
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
import { IMPERSONATE_COOKIE } from '../../config/cookie-names';
import {
    selectMenuPages,
    selectProfilePages,
    transformNavigationPages,
    selectFooterPages
} from '../../utils/navigation.utils';
import type { IPageItem, IGetPageResponse, IPageContent, ILanguage } from '../../shared';

/** SSR cache lifetime for `/languages` in seconds. */
const LANGUAGES_REVALIDATE_SECONDS = 300;

/**
 * Whether this Symfony route is an "admin session lifecycle" endpoint
 * that must always run with the original admin's JWT, even during an
 * impersonation session. Mirrors the same list in
 * `src/app/api/_lib/proxy.ts` — keep both in lock-step.
 */
function isAdminSessionRoute(path: string): boolean {
    return (
        path.startsWith('/auth/login') ||
        path.startsWith('/auth/logout') ||
        path.startsWith('/auth/refresh-token') ||
        path.startsWith('/auth/two-factor') ||
        path.startsWith('/auth/set-language')
    );
}

async function authHeaders(path: string): Promise<HeadersInit> {
    const jar = await cookies();
    const adminToken = jar.get(AUTH_COOKIE)?.value;
    const impersonationToken = jar.get(IMPERSONATE_COOKIE)?.value;

    // Pick: impersonation > admin, except for session-lifecycle routes.
    const token =
        impersonationToken && !isAdminSessionRoute(path)
            ? impersonationToken
            : adminToken;

    const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Client-Type': 'web',
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
            headers: { ...(await authHeaders(path)), ...(init.headers || {}) },
        });
        if (!res.ok) return null;
        return (await res.json()) as T;
    } catch {
        return null;
    }
}

/**
 * Like {@link fetchJson} but surfaces the HTTP status alongside the parsed
 * body. Used by the slug page to tell a real 404 (page missing) apart from a
 * 503 (the instance is in maintenance — Symfony's `MaintenanceModeListener`
 * returns a clean 503 for normal `/cms-api` traffic), so it can render the
 * maintenance page instead of `notFound()`. `status` is `null` when the
 * request never completed (network error / backend down).
 */
async function fetchJsonWithStatus<T>(
    path: string,
    init: RequestInit = {}
): Promise<{ status: number | null; data: T | null }> {
    const url = `${SYMFONY_INTERNAL_URL}${SYMFONY_API_PREFIX}${path}`;
    try {
        const res = await fetch(url, {
            cache: 'no-store',
            ...init,
            headers: { ...(await authHeaders(path)), ...(init.headers || {}) },
        });
        if (!res.ok) return { status: res.status, data: null };
        return { status: res.status, data: (await res.json()) as T };
    } catch {
        return { status: null, data: null };
    }
}

/**
 * Unwrap a Symfony SSR list envelope to its array payload. Accepts the raw
 * `{ data: [...] }` envelope or a bare array (older shapes), returning `[]`
 * otherwise. Mirrors the previous inline
 * `Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : []`.
 */
export function unwrapSsrList(raw: unknown): unknown[] {
    if (Array.isArray(raw)) return raw;
    const data = (raw as { data?: unknown } | null | undefined)?.data;
    return Array.isArray(data) ? data : [];
}

/**
 * Extract the page node from a `/pages/by-keyword` envelope. The payload is
 * `{ data: { page } }`; older shapes returned the page directly under `data`,
 * so we fall back to `data` itself (matching the previous inline
 * `envelope?.data?.page ?? envelope?.data ?? null`).
 */
export function extractSsrPage(envelope: IGetPageResponse | null): IPageContent | null {
    const data = envelope?.data;
    if (!data) return null;
    return (data.page ?? (data as unknown as IPageContent)) ?? null;
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
export const getFrontendPagesSSR = cache(async (languageId: number): Promise<unknown> => {
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
    const list = unwrapSsrList(raw);
    if (list.length === 0) return [];
    const transformed = transformNavigationPages(list as Parameters<typeof transformNavigationPages>[0]);
    return selectMenuPages(transformed);
});

/**
 * Resolve the server-rendered footer items for a given language.
 * Matches the logic in useAppNavigation().footerPages.
 */
export const getFooterPagesSSR = cache(async (languageId: number): Promise<IPageItem[]> => {
    const raw = await getFrontendPagesSSR(languageId);
    const list = unwrapSsrList(raw);
    if (list.length === 0) return [];
        const transformed = transformNavigationPages(list as Parameters<typeof transformNavigationPages>[0]);
        return selectFooterPages(transformed);
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
    const list = unwrapSsrList(raw);
    if (list.length === 0) return [];
    const transformed = transformNavigationPages(list as Parameters<typeof transformNavigationPages>[0]);
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
    const list = unwrapSsrList(raw);
    if (list.length === 0) return empty;

    const find = (nodes: unknown[]): { title: string | null; description: string | null } | null => {
        for (const node of nodes) {
            if (!node || typeof node !== 'object') continue;
            const n = node as { keyword?: unknown; title?: unknown; description?: unknown; children?: unknown };
            if (n.keyword === keyword) {
                const title = typeof n.title === 'string' && n.title.trim() ? n.title.trim() : null;
                const description =
                    typeof n.description === 'string' && n.description.trim()
                        ? n.description.trim()
                        : null;
                return { title, description };
            }
            if (Array.isArray(n.children) && n.children.length > 0) {
                const hit = find(n.children);
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
): Promise<IGetPageResponse | null> {
    const params = new URLSearchParams({ language_id: String(languageId) });
    if (preview) params.set('preview', '1');
    return fetchJson(`/pages/by-keyword/${encodeURIComponent(keyword)}?${params.toString()}`);
}

/**
 * Fetch the full admin pages tree for the current authenticated user. Used
 * by the admin SSR layout to prefill the navbar so the admin console doesn't
 * need to flash an empty tree on first paint.
 */
export async function getAdminPagesSSR(): Promise<unknown> {
    return fetchJson(`/admin/pages`);
}

/**
 * Fetch the system lookups table (timezones, type codes, weekdays, audit
 * categories). The response rarely changes so it ships at the `LOOKUPS`
 * cache tier (30 m stale / 1 h gc); prefetching on the admin shell boot
 * means inspector / form components get instant dropdown data without a
 * client round-trip.
 *
 * Authenticated-only — anonymous SSR requests get a `null` envelope.
 * Was `getAdminLookupsSSR()` calling `/admin/lookups` until the route
 * was demoted to `/lookups` in Symfony migration Version20260508160000.
 */
export async function getSystemLookupsSSR(): Promise<unknown> {
    return fetchJson(`/lookups`);
}

/**
 * Discriminated outcome of the SSR `/auth/user-data` probe so the admin
 * guards can tell a GENUINE "logged out" apart from a TRANSIENT backend
 * outage.
 *
 * This mirrors the client `isTransientApiError` classification and the
 * proxy / BFF `RefreshOutcome` (`ok` / `invalid` / `unreachable`) so all
 * three layers agree on what counts as "the backend is briefly down while
 * the manager restarts Symfony for a plugin/system operation" vs. "the
 * session is dead":
 *
 *   - `ok`             → 2xx carrying a user envelope.
 *   - `unauthenticated`→ a definitive 4xx (incl. `401`) or an empty 2xx
 *                        envelope: the session is genuinely gone → redirect
 *                        to login.
 *   - `unreachable`    → no response (network) or a 5xx: the backend is
 *                        briefly unavailable mid-restart. NOT a logout — the
 *                        httpOnly cookies are intact, so callers must keep
 *                        the operator in place and let the client recover.
 */
export type SsrAuthOutcome =
    | { status: 'ok'; data: unknown }
    | { status: 'unauthenticated' }
    | { status: 'unreachable' };

/**
 * Probe `/auth/user-data` for the SSR admin guards, classifying the result
 * into {@link SsrAuthOutcome}. Unlike {@link getAuthMeSSR} it preserves the
 * transient-vs-genuine distinction so a plugin/system-update restart no
 * longer renders as a logout (the guard fails open instead of bouncing to
 * `/login`).
 *
 * Wrapped in `cache()` so the admin layout, every admin `page.tsx` guard,
 * and the `getAuthMeSSR` envelope reader all share a single Symfony
 * round-trip per request.
 */
export const getAuthMeSSRResult = cache(async (): Promise<SsrAuthOutcome> => {
    const { status, data } = await fetchJsonWithStatus<unknown>(`/auth/user-data`);
    // No HTTP status at all (request never completed) or any 5xx → the
    // backend is briefly down (connection refused / mid-boot): transient.
    if (status === null || status >= 500) return { status: 'unreachable' };
    // A 2xx carrying an envelope is the only "logged in" outcome.
    if (status >= 200 && status < 300 && data) return { status: 'ok', data };
    // Any 4xx (incl. `401`) or an empty 2xx envelope → genuinely not authed.
    return { status: 'unauthenticated' };
});

/**
 * Fetch the current authenticated user's profile + ACL version, returning
 * the raw envelope on success and `null` otherwise.
 *
 * Used by `ServerProviders` to seed the `['user-data']` cache — it
 * deliberately only seeds on a non-null result, so a transient outage never
 * seeds a logout sentinel. Derived from {@link getAuthMeSSRResult} so the
 * two share a single `cache()`-wrapped Symfony round-trip per request.
 */
export const getAuthMeSSR = cache(async (): Promise<unknown> => {
    const result = await getAuthMeSSRResult();
    return result.status === 'ok' ? result.data : null;
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
export const getPublicLanguagesSSR = cache(async (): Promise<ILanguage[] | null> => {
    const raw = await fetchJson<unknown>(`/languages`, {
        cache: 'force-cache',
        next: { revalidate: LANGUAGES_REVALIDATE_SECONDS },
    } as RequestInit & { next?: { revalidate?: number } });
    if (!raw) return null;
    if (Array.isArray(raw)) return raw as ILanguage[];
    const data = (raw as { data?: unknown }).data;
    return Array.isArray(data) ? (data as ILanguage[]) : null;
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
    languages: ILanguage[];
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

    let selected: ILanguage | undefined;

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
    async (keyword: string, languageId: number, preview = false): Promise<IGetPageResponse | null> => {
        return getPageByKeywordSSR(keyword, languageId, preview);
    }
);

/**
 * Status-aware variant of {@link getPageByKeywordSSRCached}. Returns both the
 * HTTP status and the parsed envelope so the slug page can distinguish a 404
 * (render `notFound()`) from a 503 (render the maintenance page). Deduplicated
 * per request via `cache()`.
 */
export const getPageByKeywordSSRStatus = cache(
    async (
        keyword: string,
        languageId: number,
        preview = false
    ): Promise<{ status: number | null; data: IGetPageResponse | null }> => {
        const params = new URLSearchParams({ language_id: String(languageId) });
        if (preview) params.set('preview', '1');
        return fetchJsonWithStatus(`/pages/by-keyword/${encodeURIComponent(keyword)}?${params.toString()}`);
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
