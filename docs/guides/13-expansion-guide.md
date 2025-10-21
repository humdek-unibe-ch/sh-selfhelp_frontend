# 13. 📈 Expansion Guide

## Adding New Pages

1. **Create route file**:
```typescript
// src/app/new-feature/page.tsx
export default function NewFeaturePage() {
    return <NewFeatureComponent />;
}
```

2. **Add to navigation**:
```typescript
// Update navigation configuration
const routes = [
    { path: '/new-feature', label: 'New Feature', icon: <IconNew /> }
];
```

## Adding New API Endpoints

1. **Update API config**:
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

## Adding New Style Components

1. **Create style component**:
```typescript
// src/app/components/styles/SelfHelpStyles/NewStyle.tsx
export function NewStyle({ style }: { style: TStyle }) {
    const content = getFieldContent(style, 'content');

    return (
        <Box>
            <Text>{content}</Text>
        </Box>
    );
}
```

2. **Register in BasicStyle**:
```typescript
// src/app/components/styles/BasicStyle.tsx
switch (style.style_name) {
    case 'newStyle':
        return <NewStyle style={style} />;
    // ... other cases
}
```

## Adding New Permissions

1. **Define permission constants**:
```typescript
// src/constants/permissions.constants.ts
export const PERMISSIONS = {
    NEW_FEATURE_VIEW: 'new-feature.view',
    NEW_FEATURE_CREATE: 'new-feature.create',
} as const;
```

2. **Use in components**:
```typescript
// Permission-protected component
const hasCreatePermission = hasPermission(PERMISSIONS.NEW_FEATURE_CREATE);

return (
    <div>
        {hasCreatePermission && (
            <Button onClick={handleCreate}>Create New Item</Button>
        )}
    </div>
);
```

---

**[← Previous: Development Guidelines](12-development-guidelines.md)** | **[Back to Main Guide](../COMPREHENSIVE_FRONTEND_GUIDE.md)**
