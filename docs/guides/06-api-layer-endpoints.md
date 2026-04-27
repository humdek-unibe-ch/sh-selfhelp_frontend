# 6. 🔗 API Layer & Endpoint Management

> **BFF routing.** Axios is configured with `baseURL = '/api'`, so every
> `apiClient.get('/admin/...')` call lands on the Next.js BFF proxy
> (`src/app/api/[...path]/route.ts`), not on Symfony directly. The proxy
> attaches `Authorization: Bearer <sh_auth>`, validates `X-CSRF-Token`,
> handles silent refresh, and rewrites token-bearing response bodies into
> httpOnly cookies. See `docs/architecture/ssr-bff-architecture.md` §15
> for the full lifecycle.
>
> A single non-`/api/[...path]/...` BFF route exists today:
> `src/app/api/auth/events/route.ts` — a custom Server-Sent Events (SSE)
> proxy to the Mercure hub used for real-time ACL invalidation. The
> browser hook `useAclEventStream` opens an `EventSource` to it; on every
> `acl-changed` message we invalidate `['user-data']`, which cascades
> into the navigation / page-content caches via `useAclVersionWatcher`.

## Centralized Configuration

All API endpoints are centralized in `src/config/api.config.ts`:

```typescript
export const API_CONFIG = {
    BASE_URL: `${API_BASE_URL}/cms-api/v1`,
    ENDPOINTS: {
        // Authentication
        AUTH_LOGIN: '/auth/login',
        AUTH_REFRESH_TOKEN: '/auth/refresh-token',
        AUTH_LOGOUT: '/auth/logout',

        // Pages
        PAGE_BY_KEYWORD: (keyword: string) => `/pages/by-keyword/${keyword}`,
        ADMIN_PAGES_GET_ALL: '/admin/pages',
        ADMIN_PAGES_CREATE: '/admin/pages',

        // Sections
        ADMIN_SECTIONS_CREATE_CHILD: (keyword: string, parentId: number) =>
            `/admin/pages/${keyword}/sections/${parentId}/sections/create`,
        ADMIN_PAGE_SECTIONS_IMPORT: (keyword: string) =>
            `/admin/pages/${keyword}/sections/import`,
        ADMIN_SECTION_SECTIONS_IMPORT: (sectionId: number) =>
            `/admin/sections/${sectionId}/sections/import`,

        // AI / section generation
        ADMIN_AI_SECTION_PROMPT_TEMPLATE: '/admin/ai/section-prompt-template',

        // ... 50+ more endpoints
    },
    CORS_CONFIG: {
        credentials: true,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Client-Type': 'web'
        },
    },
};
```

### Non-JSON endpoints

Most endpoints exchange JSON, with two intentional exceptions wired
through the same `apiClient`:

- `ADMIN_AI_SECTION_PROMPT_TEMPLATE` — the frontend sends
  `Accept: text/markdown` and reads the response body as a markdown
  string (used by the "Copy AI prompt" button in the import-sections
  modal). See `fetchAiSectionPromptTemplate()` in
  `src/api/admin/section.api.ts`.
- `/api/auth/events` — opened with `EventSource`, **not** Axios. The
  body is a `text/event-stream` and the connection is held open by the
  browser; reconnection logic with exponential backoff lives in
  `src/hooks/useAclEventStream.ts`.

## API Client Structure

**Base API Client** (`src/api/base.api.ts`):
- Axios instance with interceptors
- Automatic token refresh
- Request/response logging
- Error handling

**Specialized API Modules**:
- `AuthApi`: Authentication operations
- `PageApi`: Public page content
- `AdminPageApi`: Admin page management
- `AdminUserApi`: User management
- `AdminAssetApi`: File management

## API Call Pattern

```typescript
// API service method
export const AdminPageApi = {
    async getPage(keyword: string): Promise<IAdminPageResponse> {
        const response = await apiClient.get(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_GET_ONE(keyword)
        );
        return response.data;
    },

    async updatePage(keyword: string, data: IUpdatePageRequest): Promise<IAdminPageResponse> {
        const response = await apiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_UPDATE(keyword),
            data
        );
        return response.data;
    }
};

// React Query hook
export function usePageDetails(keyword: string) {
    return useQuery({
        queryKey: ['page-details', keyword],
        queryFn: () => AdminPageApi.getPage(keyword),
        enabled: !!keyword,
    });
}
```

## Adding New API Endpoints

1. **Add endpoint to config**:
```typescript
// src/config/api.config.ts
ENDPOINTS: {
    NEW_FEATURE_GET_ALL: '/admin/new-feature',
    NEW_FEATURE_CREATE: '/admin/new-feature',
}
```

2. **Create API service**:
```typescript
// src/api/admin/new-feature.api.ts
export const NewFeatureApi = {
    async getAll(): Promise<INewFeatureResponse[]> {
        const response = await apiClient.get(
            API_CONFIG.ENDPOINTS.NEW_FEATURE_GET_ALL
        );
        return response.data;
    }
};
```

3. **Create React Query hook**:
```typescript
// src/hooks/useNewFeature.ts
export function useNewFeatures() {
    return useQuery({
        queryKey: ['new-features'],
        queryFn: () => NewFeatureApi.getAll(),
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    });
}
```

---

**[← Previous: Component Architecture & Styling](05-component-architecture-styling.md)** | **[Next: Language System & Internationalization →](07-language-internationalization.md)**
