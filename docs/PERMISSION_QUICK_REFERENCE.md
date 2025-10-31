# 🔐 Permission Wrapper Quick Reference

## Core Concept
**Permission-aware API client prevents unnecessary backend calls** by checking user permissions before HTTP requests.

## Key Files
- `src/api/permission-aware-client.api.ts` - Wrapper that attaches permission metadata
- `src/api/permission-wrapper.api.ts` - Interceptor that validates permissions
- `src/config/api.config.ts` - Endpoint configurations with permissions

## Usage (Always Use This)

```typescript
import { permissionAwareApiClient } from '@/api/permission-aware-client.api';
import { API_CONFIG } from '@/config/api.config';

// ✅ CORRECT - Automatic permission checking
await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_USERS_GET_ALL);
await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_USERS_CREATE, userData);
await permissionAwareApiClient.put(API_CONFIG.ENDPOINTS.ADMIN_USERS_UPDATE, userData, userId);
await permissionAwareApiClient.delete(API_CONFIG.ENDPOINTS.ADMIN_USERS_DELETE, userId);
```

## Never Use This (Throws Error)

```typescript
// ❌ INCORRECT - Bypasses permission checking
await apiClient.get('/api/admin/users'); // Throws PermissionDeniedError
```

## Flow Summary

1. **permissionAwareApiClient** attaches `_permissionMetadata` to request
2. **Axios interceptor** checks user permissions before HTTP call
3. **PermissionDeniedError** thrown immediately if insufficient permissions
4. **No backend call** made when permissions denied

## UI Permission Checks

```typescript
import { canAccessEndpoint, getEndpointPermissions } from '@/api/permission-wrapper.api';

// Check if user can access endpoint
const canViewUsers = canAccessEndpoint('ADMIN_USERS_GET_ALL');

// Get required permissions for endpoint
const requiredPerms = getEndpointPermissions('ADMIN_USERS_CREATE');
```

## React Hooks

```typescript
import { usePermissionCheck, useCanAccessEndpoint } from '@/hooks/usePermissions';

// Component-level permission check
const MyComponent = () => {
    const hasPermission = usePermissionCheck(['admin.users.create']);

    return hasPermission ? <CreateUserButton /> : null;
};
```

## Error Handling

```typescript
import { PermissionDeniedError } from '@/api/permission-wrapper.api';

try {
    await permissionAwareApiClient.delete(API_CONFIG.ENDPOINTS.ADMIN_USERS_DELETE, userId);
} catch (error) {
    if (error instanceof PermissionDeniedError) {
        // Show UI feedback - no backend call was made
        toast.error('Insufficient permissions');
    }
}
```

## Benefits

- 🚀 **Performance**: No unnecessary network requests
- ⚡ **UX**: Instant feedback for permission-denied actions
- 🔒 **Security**: Defense-in-depth validation
- ⚙️ **Zero Config**: Works automatically with existing code
- 📝 **Type Safe**: Full TypeScript support

## Remember

**ALWAYS use `permissionAwareApiClient`** instead of `apiClient` for any backend API calls that require permissions. This ensures automatic permission validation and prevents unnecessary backend requests.
