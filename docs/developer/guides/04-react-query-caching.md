/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
# 4. React Query & Caching Strategy

Audience: Developers and technical operators.
Status: active.
Applies to: SelfHelp2 Next.js frontend.
Last verified: 2026-06-03.
Source of truth: Runtime code, configuration, and tests in this repository.

## Client factory: `getQueryClient()`

`src/providers/query-client.ts` exposes a single factory used by both
runtimes:

```typescript
import { QueryClient, isServer } from '@tanstack/react-query';

export function getQueryClient(): QueryClient {
  if (isServer) return new QueryClient({ defaultOptions: REACT_QUERY_CONFIG.DEFAULT_OPTIONS });
  return (browserQueryClient ??= new QueryClient({ defaultOptions: REACT_QUERY_CONFIG.DEFAULT_OPTIONS }));
}
```

- **Server**: a fresh client per request (sharing across requests would
  leak one visitor's cache into another's render).
- **Browser**: a singleton for the lifetime of the tab so SPA-style
  navigations share the cache.

Always call `getQueryClient()` rather than `new QueryClient(...)` —
that's how non-React callers (Refine's `authProvider`,
`server-providers.tsx`, the admin layout SSR prefetch) read and write
the same cache the `<QueryClientProvider>` mounts.

## SSR seeding

Server-side prefetches in `src/app/_lib/server-fetch.ts`
(`getFrontendPagesSSR`, `getPageByKeywordSSRCached`,
`getAdminLookupsSSR`, …) are dehydrated by
`src/providers/server-providers.tsx` into a `<HydrationBoundary>`. The
first client render therefore starts with the same cache the server
just used — zero refetches, zero waterfalls.

## Global Configuration

`src/config/react-query.config.ts` exposes `REACT_QUERY_CONFIG.CACHE_TIERS`
(every query picks exactly one tier — there is **no** legacy `CACHE` /
`SPECIAL_CONFIGS` alias), `DEFAULT_OPTIONS`, and the `QUERY_KEYS` registry.

```typescript
// src/config/react-query.config.ts (CACHE_TIERS — abridged)
const CACHE_TIERS = {
    DEFAULT:        { staleTime: 60_000,      gcTime: 5 * MINUTE },    // sane baseline
    PAGE_CONTENT:   { staleTime: 1_000,       gcTime: MINUTE },        // frontend pages (SSR-seeded)
    FRONTEND_PAGES: { staleTime: 10 * MINUTE, gcTime: 30 * MINUTE },   // nav; ACL-version invalidated
    ADMIN_PAGES:    { staleTime: 5 * MINUTE,  gcTime: 30 * MINUTE },   // admin list
    LOOKUPS:        { staleTime: 30 * MINUTE, gcTime: 60 * MINUTE },
    STATIC:         { staleTime: 30 * MINUTE, gcTime: 60 * MINUTE },
    LANGUAGES:      { staleTime: Infinity,    gcTime: Infinity },
    USER_DATA:      { staleTime: 30_000,      gcTime: 5 * MINUTE, refetchOnWindowFocus: true },
    REAL_TIME:      { staleTime: 0,           gcTime: 30_000 },
} as const;
```

## Caching Strategy

Pick the tier that matches the data's volatility:

- **`PAGE_CONTENT` (1s / 1m)** — public page content; rapidly editable but SSR-seeded, so mount refetches are rare.
- **`USER_DATA` (30s / 5m, focus-refetch)** — auth/user-data; the focus refetch picks up `acl_version` rotations.
- **`DEFAULT` (60s / 5m)** — baseline for anything without a more specific tier.
- **`ADMIN_PAGES` (5m / 30m)** — admin page list; invalidated after admin mutations.
- **`FRONTEND_PAGES` (10m / 30m)** — navigation; invalidated only on `acl_version` change (see `useAclVersionWatcher`).
- **`LOOKUPS` / `STATIC` (30m / 1h)** — practically immutable enums/config.
- **`LANGUAGES` (∞ / ∞)** — manual invalidation only.
- **`REAL_TIME` (0s / 30s)** — opt-in, always refetch on mount.

## Custom Hooks Pattern

```typescript
// Standard query hook pattern (keyword-only; language + preview from context).
// See src/hooks/usePageContentByKeyword.ts — the key comes from the registry.
export function usePageContentByKeyword(keyword: string) {
    const { currentLanguageId } = useLanguageContext();
    const { isPreviewMode } = usePreviewMode();
    return useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD(keyword, currentLanguageId, isPreviewMode),
        queryFn: () => PageApi.getPageByKeyword(keyword, currentLanguageId, isPreviewMode),
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.PAGE_CONTENT.staleTime,
        gcTime: isPreviewMode ? 0 : REACT_QUERY_CONFIG.CACHE_TIERS.PAGE_CONTENT.gcTime,
        enabled: !!keyword,
    });
}

// Mutation hook pattern — invalidate the SAME registry keys the readers use, so
// the writer can never drift from the reader (see useUpdatePageMutation).
export function useUpdatePageMutation() {
    const queryClient = useQueryClient();
    const QK = REACT_QUERY_CONFIG.QUERY_KEYS;

    return useMutation({
        mutationFn: ({ pageId, updateData }: IUpdatePageMutationVariables) =>
            AdminApi.updatePage(pageId, updateData),
        onSuccess: async (_data, { pageId }) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: QK.ADMIN_PAGES }),
                queryClient.invalidateQueries({ queryKey: QK.PAGE_FIELDS(pageId) }),
                queryClient.invalidateQueries({ queryKey: QK.PAGE_SECTIONS(pageId) }),
                queryClient.invalidateQueries({ queryKey: QK.PAGE_BY_KEYWORD_ALL }),
                queryClient.invalidateQueries({ queryKey: QK.FRONTEND_PAGES_ALL }),
            ]);
        },
    });
}
```

## Query Key Patterns

Keys shared across a **reader/writer boundary** (a hook reads a key and a
*different* hook/component invalidates it) live in
`REACT_QUERY_CONFIG.QUERY_KEYS`. Sourcing both sides from the registry is what
prevents writer/reader drift — the bug class where a mutation invalidates a key
no read hook subscribes to and the UI silently goes stale. Function entries
return the full key; the `*_ALL` constants are the prefix bases writers use to
invalidate every variant at once (React Query matches by key prefix).

```typescript
// src/config/react-query.config.ts (QUERY_KEYS — abridged)
QUERY_KEYS: {
    FRONTEND_PAGES: (languageId) => ['frontend-pages', languageId],
    FRONTEND_PAGES_ALL: ['frontend-pages'],
    PAGE_BY_KEYWORD: (keyword, languageId, preview = false) =>
        ['page-by-keyword', keyword, languageId, preview ? 'preview' : 'published'],
    PAGE_BY_KEYWORD_ALL: ['page-by-keyword'],
    ADMIN_PAGES: ['admin-pages'],
    PAGE_SECTIONS: (pageId) => ['pageSections', pageId],
    PAGE_SECTIONS_ALL: ['pageSections'],
    PAGE_FIELDS: (pageId) => ['pageFields', pageId],
    PAGE_VERSIONS: (pageId) => ['page-versions', pageId],   // writers use this prefix;
                                                            // the list reader appends params
    UNPUBLISHED_CHANGES: (pageId) => ['unpublished-changes', pageId],
    ADMIN_SECTIONS_UNUSED: ['admin', 'sections', 'unused'],
    ADMIN_SECTIONS_REF_CONTAINERS: ['admin', 'sections', 'ref-containers'],
    SECTION_DETAILS: (pageId, sectionId) => ['admin', 'sections', 'details', pageId, sectionId],
    LOOKUPS: ['lookups'],
    STYLE_GROUPS: ['style-groups'],
    // …
}
```

Keys defined **and** invalidated inside a single hook (e.g. `useAssets`,
`useCache`, `useScheduledJobs`) can't drift, so they may stay local — promote
them to the registry the moment a second file needs them.

---

**[← Previous: CMS Structure & Page System](./03-cms-structure-page-system.md)** | **[Next: Component Architecture & Styling →](./05-component-architecture-styling.md)**
