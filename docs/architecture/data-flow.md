# Data Flow Patterns

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
// Query pattern
export function usePageContent(keyword: string, languageId?: number) {
    return useQuery({
        queryKey: ['page-content', keyword, languageId],
        queryFn: () => PageApi.getPageContent(keyword, languageId),
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    });
}

// Mutation pattern
export function useUpdatePageMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: IUpdatePageRequest) => AdminPageApi.updatePage(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-pages'] });
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
```typescript
// Consistent query key structure
QUERY_KEYS = {
    FRONTEND_PAGES: (languageId: number) => ['frontend-pages', languageId],
    PAGE_CONTENT: (keyword: string, languageId?: number) =>
        languageId ? ['page-content', keyword, languageId] : ['page-content', keyword],
    ADMIN_PAGES: ['admin-pages'],
    LOOKUPS: ['lookups'],
    STYLE_GROUPS: ['style-groups'],
};
```

### Caching Strategy
- **Short Cache (30s)**: Dynamic content (page content, user data)
- **Medium Cache (5min)**: Semi-static data (lookups, style groups)
- **Long Cache (10min)**: Static configuration (system preferences, style definitions)

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

**[Back to Main Guide](../COMPREHENSIVE_FRONTEND_GUIDE.md)**
