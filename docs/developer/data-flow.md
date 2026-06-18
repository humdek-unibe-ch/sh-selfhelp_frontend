/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
# Data Flow Patterns

Audience: Developers and technical operators.
Status: active.
Applies to: SelfHelp2 Next.js frontend.
Last verified: 2026-06-03.
Source of truth: Runtime code, configuration, and tests in this repository.

## Application Data Flow

```
User Action → React Component → React Query Hook → API Service → Backend
            ← UI Update    ← Cache Update   ← API Response ←
```

## State Management Strategy

### React Query (Server State)
- **Purpose**: API data, caching, synchronization
- **Usage**: All server state management
- **Benefits**: Automatic caching, background updates, optimistic updates

```typescript
// Query pattern (current — see src/hooks/usePageContentByKeyword.ts)
// language + preview are pulled from contexts so callers stay simple.
// The key comes from the registry (PAGE_BY_KEYWORD encodes the
// 'published'|'preview' suffix, not a raw boolean).
export function usePageContentByKeyword(keyword: string) {
    const { currentLanguageId } = useLanguageContext();
    const { isPreviewMode } = usePreviewMode();
    return useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD(keyword, currentLanguageId, isPreviewMode),
        queryFn: () => PageApi.getPageByKeyword(keyword, currentLanguageId, isPreviewMode),
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.PAGE_CONTENT.staleTime,
    });
}

// Mutation pattern — invalidate the SAME registry keys the readers use.
export function useUpdatePageMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: IUpdatePageRequest) => AdminPageApi.updatePage(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES });
        },
    });
}
```

### Zustand (Client State)
- **Purpose**: Complex client state not suitable for React Query
- **Usage**: When React Query is not appropriate
- **Benefits**: Lightweight, simple API, TypeScript support

```typescript
// Store definition
interface IAppStore {
    userPreferences: IUserPreferences;
    setUserPreferences: (preferences: IUserPreferences) => void;
}

export const useAppStore = create<IAppStore>((set) => ({
    userPreferences: defaultPreferences,
    setUserPreferences: (preferences) => set({ userPreferences: preferences }),
}));
```

### React Context (Global UI State)
- **Purpose**: Theme, language, global UI state
- **Usage**: Application-wide settings
- **Benefits**: Built-in React solution, TypeScript support

```typescript
// Context definition
interface ILanguageContextValue {
    currentLanguageId: number;
    setCurrentLanguageId: (id: number) => void;
    languages: ILanguage[];
}

export const LanguageContext = createContext<ILanguageContextValue | undefined>(undefined);
```

## Data Fetching Strategy

### Query Key Patterns
Shared (reader/writer-boundary) keys live in `REACT_QUERY_CONFIG.QUERY_KEYS`
so a writer's invalidation can never drift from the reader's key. Function
entries return the full key; `*_ALL` constants are prefix bases for invalidating
every variant at once.

```typescript
// src/config/react-query.config.ts (QUERY_KEYS — abridged)
QUERY_KEYS = {
    FRONTEND_PAGES: (languageId: number) => ['frontend-pages', languageId],
    FRONTEND_PAGES_ALL: ['frontend-pages'],
    PAGE_BY_KEYWORD: (keyword, languageId, preview = false) =>
        ['page-by-keyword', keyword, languageId, preview ? 'preview' : 'published'],
    PAGE_BY_KEYWORD_ALL: ['page-by-keyword'],
    ADMIN_PAGES: ['admin-pages'],
    PAGE_SECTIONS: (pageId) => ['pageSections', pageId],
    PAGE_VERSIONS: (pageId) => ['page-versions', pageId],
    UNPUBLISHED_CHANGES: (pageId) => ['unpublished-changes', pageId],
    ADMIN_SECTIONS_UNUSED: ['admin', 'sections', 'unused'],
    LOOKUPS: ['lookups'],
    STYLE_GROUPS: ['style-groups'],
    // …
};
```

### Caching Strategy
Tiers live in `REACT_QUERY_CONFIG.CACHE_TIERS`; pick one rather than setting
`staleTime`/`gcTime` by hand:
- **`PAGE_CONTENT` (1s / 1m)**: public page content (SSR-seeded).
- **`USER_DATA` (30s / 5m, focus-refetch)**: auth/user data.
- **`ADMIN_PAGES` (5m / 30m)** and **`FRONTEND_PAGES` (10m / 30m)**: admin list / nav.
- **`LOOKUPS` / `STATIC` (30m / 1h)**: near-immutable enums/config.
- **`LANGUAGES` (∞)**: manual invalidation only.

## Navigation & Page Loading

### Smart Navigation System
```typescript
// Always refresh navigation on page changes
useEffect(() => {
    if (keyword) {
        refreshOnPageChange(); // Silent background refresh
    }
}, [keyword, refreshOnPageChange]);

// Refresh after user actions
const submitMutation = useMutation({
    onSuccess: async () => {
        await refreshAfterUserAction(); // Visible refresh for new access
    }
});
```

### Loading State Management
```typescript
// Show loading only on initial load
if ((pageLoading && !pageContent) || (navLoading && routes.length === 0)) {
    return <Loader />;
}

// Show existing content during updates
const isContentUpdating = pageFetching || isUpdatingLanguage;
return (
    <Container className={isContentUpdating ? 'page-content-loading' : ''}>
        <PageContentRenderer sections={sections} />
    </Container>
);
```

## Form Data Management

### Controlled Components Pattern
```typescript
export function FormComponent() {
    const [formData, setFormData] = useState(initialData);
    const mutation = useFormMutation();

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <TextInput
                value={formData.title}
                onChange={(value) => handleChange('title', value)}
            />
        </form>
    );
}
```

## Error Handling

### Global Error Boundaries
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
    <App />
</ErrorBoundary>
```

### API Error Handling
```typescript
export function useApiData() {
    return useQuery({
        queryKey: ['api-data'],
        queryFn: fetchApiData,
        onError: (error) => {
            console.error('API Error:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to load data',
                color: 'red',
            });
        },
    });
}
```

---

**[Back to Main Guide](../archive/comprehensive-frontend-guide.md)**
