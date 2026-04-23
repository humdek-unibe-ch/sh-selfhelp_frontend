/**
 * React Query global configuration with tiered caching.
 *
 * See `docs/architecture/ssr-bff-architecture.md` §6 for the full
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
            retry: 1,
            retryDelay: 1000,
        },
    },

    CACHE_TIERS,

    QUERY_KEYS: {
        FRONTEND_PAGES: (languageId: number) => ['frontend-pages', languageId],
        ADMIN_PAGES: ['admin-pages'],
        LANGUAGES: ['languages'],
        PUBLIC_LANGUAGES: ['public-languages'],
        PAGE_BY_KEYWORD: (keyword: string, languageId: number, preview = false) =>
            ['page-by-keyword', keyword, languageId, preview ? 'preview' : 'published'] as const,
        PAGE_DETAILS: (keyword: string) => ['page-details', keyword],
        SECTION_DETAILS: (keyword: string, sectionId: number) => ['section-details', keyword, sectionId],
        LOOKUPS: ['lookups'],
        STYLE_GROUPS: ['style-groups'],
        USER_DATA: ['user-data'],
    },
} as const;
