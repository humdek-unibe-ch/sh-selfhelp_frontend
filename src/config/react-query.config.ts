/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * React Query global configuration with tiered caching.
 *
 * See `docs/developer/ssr-bff-architecture.md` for the full
 * rationale: what is stored here vs in Zustand vs in `nuqs`, why the
 * cache-key space is kept small, and how SSR prefetches seed the cache.
 *
 * Every query picks exactly one tier from `CACHE_TIERS`. There is no legacy
 * `CACHE` or `SPECIAL_CONFIGS` alias — callers import `CACHE_TIERS.<TIER>`
 * directly so the cache policy is visible at the call site.
 *
 * Cache policy overview:
 * - DEFAULT: 60s stale / 5m gc. Sane baseline for anything that doesn't need
 *   a more specific tier.
 * - PAGE_CONTENT: 1s stale / 1m gc. Frontend pages can change rapidly but
 *   SSR prefill means mount refetches are rare.
 * - FRONTEND_PAGES (nav): 10m stale / 30m gc. Genuinely long-lived —
 *   invalidated only when the user's `acl_version` changes
 *   (see `useAclVersionWatcher`).
 * - ADMIN_PAGES: 5m stale / 30m gc. Invalidated after admin mutations.
 * - LOOKUPS / STATIC: 30m stale / 1h gc. Rarely change. `STATIC` is an
 *   alias for callers that aren't strictly about the `lookups` endpoint
 *   but share the same "practically immutable" lifetime.
 * - LANGUAGES: Infinity / Infinity. Manual invalidation if an admin adds
 *   or edits a language.
 * - USER_DATA: 30s stale / 5m gc with `refetchOnWindowFocus` so
 *   `acl_version` rotations are picked up promptly.
 * - REAL_TIME: 0s stale / 30s gc. Opt-in for queries that must always
 *   re-fetch on mount (e.g. freshly-edited admin data tables).
 *
 * Global defaults disable `refetchOnWindowFocus` and `refetchOnReconnect`;
 * the per-query `USER_DATA` config opts into focus refetches.
 */

const MINUTE = 60_000;

const CACHE_TIERS = {
    DEFAULT: {
        staleTime: 60_000,
        gcTime: 5 * MINUTE,
    },
    PAGE_CONTENT: {
        staleTime: 1_000,
        gcTime: MINUTE,
    },
    FRONTEND_PAGES: {
        staleTime: 10 * MINUTE,
        gcTime: 30 * MINUTE,
    },
    ADMIN_PAGES: {
        staleTime: 5 * MINUTE,
        gcTime: 30 * MINUTE,
    },
    LOOKUPS: {
        staleTime: 30 * MINUTE,
        gcTime: 60 * MINUTE,
    },
    STATIC: {
        staleTime: 30 * MINUTE,
        gcTime: 60 * MINUTE,
    },
    LANGUAGES: {
        staleTime: Number.POSITIVE_INFINITY,
        gcTime: Number.POSITIVE_INFINITY,
    },
    USER_DATA: {
        staleTime: 30_000,
        gcTime: 5 * MINUTE,
        refetchOnWindowFocus: true,
    },
    REAL_TIME: {
        staleTime: 0,
        gcTime: 30_000,
    },
} as const;

export const REACT_QUERY_CONFIG = {
    DEFAULT_OPTIONS: {
        queries: {
            staleTime: CACHE_TIERS.DEFAULT.staleTime,
            gcTime: CACHE_TIERS.DEFAULT.gcTime,
            retry: 1,
            retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            networkMode: 'online',
        },
        mutations: {
            // Never auto-retry mutations: POST/PUT/DELETE are not idempotent.
            // A retried create that already committed server-side surfaces as a
            // confusing 409 ("already exists") and can race itself into
            // deadlocks. Users retry explicitly from the UI instead.
            retry: 0,
        },
    },

    CACHE_TIERS,

    /**
     * Central registry for React Query keys shared across a reader/writer
     * boundary — i.e. one hook reads a key and a *different* hook or component
     * invalidates it. Sourcing both sides from here is what prevents
     * writer/reader key drift (a writer invalidating a key no reader subscribes
     * to → silent staleness). When a key starts being shared, add it here and
     * reference it from both sides; keys that are defined and invalidated inside
     * a single hook may stay local.
     *
     * Functions return the full key; the matching `*_ALL` constants are the
     * prefix bases writers use to invalidate every variant at once (React Query
     * matches by key prefix).
     */
    QUERY_KEYS: {
        // ── Frontend navigation (public) ──────────────────────────────────
        FRONTEND_PAGES: (languageId: number) => ['frontend-pages', languageId],
        FRONTEND_PAGES_ALL: ['frontend-pages'],

        // ── Public page content (keyword-driven) ──────────────────────────
        PAGE_BY_KEYWORD: (keyword: string, languageId: number, preview = false) =>
            ['page-by-keyword', keyword, languageId, preview ? 'preview' : 'published'] as const,
        // Prefix base used by mutations and `useIsFetching` to touch every
        // keyword + language + preview variant at once.
        PAGE_BY_KEYWORD_ALL: ['page-by-keyword'],

        // ── Admin page list ───────────────────────────────────────────────
        ADMIN_PAGES: ['admin-pages'],

        // ── Admin page editor detail caches ───────────────────────────────
        // `pageId` is the numeric id in the editor and the keyword in
        // keyword-driven callers; `null`/`undefined` mirror the disabled-query
        // and optional-cache key shapes used by the read hooks and invalidations.
        PAGE_SECTIONS: (pageId?: number | string | null) => ['pageSections', pageId],
        PAGE_SECTIONS_ALL: ['pageSections'],
        PAGE_FIELDS: (pageId?: number | string | null) => ['pageFields', pageId],
        // Invalidated by the version mutations. No read hook currently
        // subscribes to this key; kept so the writers reference the registry
        // instead of a literal (forward-compatible invalidation target).
        PAGE_DETAILS: (pageId: number | string) => ['page-details', pageId],

        // ── Page versions / publishing ────────────────────────────────────
        // Writers invalidate the 2-element prefix; the list reader appends its
        // params via `[...PAGE_VERSIONS(pageId), params]`.
        PAGE_VERSIONS: (pageId: number | null) => ['page-versions', pageId],
        PAGE_VERSION: (pageId: number | null, versionId: number | null, includePageJson: boolean) =>
            ['page-version', pageId, versionId, includePageJson],
        VERSION_COMPARISON: (
            pageId: number | null,
            version1Id: number | null,
            version2Id: number | null,
            format: string,
        ) => ['version-comparison', pageId, version1Id, version2Id, format],
        UNPUBLISHED_CHANGES: (pageId: number | null) => ['unpublished-changes', pageId],

        // ── Admin section utilities (shared read/write) ───────────────────
        ADMIN_SECTIONS_UNUSED: ['admin', 'sections', 'unused'],
        ADMIN_SECTIONS_REF_CONTAINERS: ['admin', 'sections', 'ref-containers'],
        ADMIN_SECTIONS_PAGES: (sectionIds: number[]) => ['admin', 'sections', 'pages', sectionIds],
        // Per-section detail cache read by `useSectionDetails`, invalidated by
        // the section inspector after edits.
        SECTION_DETAILS: (pageId: number | null, sectionId: number | null) =>
            ['admin', 'sections', 'details', pageId, sectionId],

        // ── Admin cache management (read by useCacheStats/useCacheHealth,
        //    invalidated by the cache + section-utility clear mutations) ─────
        CACHE_STATS: ['cache-stats'],
        CACHE_HEALTH: ['cache-health'],

        // ── Static / misc ─────────────────────────────────────────────────
        LANGUAGES: ['languages'],
        PUBLIC_LANGUAGES: ['public-languages'],
        LOOKUPS: ['lookups'],
        STYLE_GROUPS: ['style-groups'],
        USER_DATA: ['user-data'],
    },
} as const;
