# 4. ⚡ React Query & Caching Strategy

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

```typescript
// src/config/react-query.config.ts
export const REACT_QUERY_CONFIG = {
    CACHE: {
        staleTime: 30 * 1000,     // 30 seconds - data freshness
        gcTime: 60 * 1000,        // 60 seconds - cache retention
    },
    SPECIAL_CONFIGS: {
        STATIC_DATA: {            // Lookups, styles, etc.
            staleTime: 5 * 60 * 1000,   // 5 minutes
            gcTime: 10 * 60 * 1000,     // 10 minutes
        },
        REAL_TIME: {              // Live data
            staleTime: 0,               // Always stale
            gcTime: 1000,               // 1 second
        }
    }
};
```

## Caching Strategy

**Short Cache (30s)**: Dynamic content that changes frequently
- Page content
- User data
- Admin data

**Medium Cache (5min)**: Semi-static data
- Lookups
- Style groups
- Language lists

**Long Cache (10min)**: Static configuration data
- System preferences
- Style definitions

## Custom Hooks Pattern

```typescript
// Standard query hook pattern (current — keyword-only, language + preview from context)
// See src/hooks/usePageContentByKeyword.ts
export function usePageContentByKeyword(keyword: string) {
    const { currentLanguageId } = useLanguageContext();
    const { isPreviewMode } = usePreviewMode();
    return useQuery({
        queryKey: ['page-by-keyword', keyword, currentLanguageId, isPreviewMode],
        queryFn: () => PageApi.getPageByKeyword(keyword, currentLanguageId, isPreviewMode),
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.PAGE_CONTENT.staleTime,
        gcTime: isPreviewMode ? 0 : REACT_QUERY_CONFIG.CACHE_TIERS.PAGE_CONTENT.gcTime,
        enabled: !!keyword,
    });
}

// Mutation hook pattern
export function useUpdatePageMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: IUpdatePageRequest) =>
            AdminPageApi.updatePage(data.keyword, data),
        onSuccess: (data, variables) => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['adminPages'] });
            queryClient.invalidateQueries({ queryKey: ['page-content'] });
        },
    });
}
```

## Query Key Patterns

```typescript
// Consistent query key structure
QUERY_KEYS: {
    FRONTEND_PAGES: (languageId: number) => ['frontend-pages', languageId],
    PAGE_CONTENT: (keyword: string, languageId?: number) =>
        languageId ? ['page-content', keyword, languageId] : ['page-content', keyword],
    ADMIN_PAGES: ['admin-pages'],
    LOOKUPS: ['lookups'],
    STYLE_GROUPS: ['style-groups'],
}
```

---

**[← Previous: CMS Structure & Page System](03-cms-structure-page-system.md)** | **[Next: Component Architecture & Styling →](05-component-architecture-styling.md)**
