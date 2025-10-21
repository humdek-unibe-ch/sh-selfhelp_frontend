# 4. ⚡ React Query & Caching Strategy

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
// Standard query hook pattern
export function usePageContent(keyword: string, languageId?: number) {
    return useQuery({
        queryKey: ['page-content', keyword, languageId],
        queryFn: () => PageApi.getPageContent(keyword, languageId),
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        enabled: !!keyword && !!languageId,
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
