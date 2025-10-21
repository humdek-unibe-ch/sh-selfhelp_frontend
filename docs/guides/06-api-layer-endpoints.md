# 6. 🔗 API Layer & Endpoint Management

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
        PAGES_GET_ONE: (keyword: string) => `/pages/${keyword}`,
        ADMIN_PAGES_GET_ALL: '/admin/pages',
        ADMIN_PAGES_CREATE: '/admin/pages',

        // Sections
        ADMIN_SECTIONS_CREATE_CHILD: (keyword: string, parentId: number) =>
            `/admin/pages/${keyword}/sections/${parentId}/sections/create`,

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
