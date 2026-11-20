/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
# Permission Wrapper Quick Reference

Audience: Developers and integrators.
Status: active.
Applies to: SelfHelp2 Next.js frontend.
Last verified: 2026-11-19.
Source of truth: Controllers, JSON schemas, route definitions, and exported types in this repository.

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

## Route Contract Test (CI)

`api.config.ts` is a hand-kept copy of which right each backend route needs (finding F32). The backend writes its route table, with methods and rights, to `docs/reference/access/api-routes.json` (`php bin/console app:access:export`, committed and checked for staleness in the backend). `src/config/__tests__/api-route-contract.test.ts` compares every `API_CONFIG.ENDPOINTS` entry with that file and fails on:

- a path with no backend route, or a method the backend route does not have (the method is read from the `<client>.<get|post|put|patch|delete>(API_CONFIG.ENDPOINTS.KEY, ...)` call sites);
- permissions that differ from the backend route row (compared as a set);
- `permissions: []` on a write of a non-public route;
- an unknown method where the routes on that path need different rights;
- a list entry that is no longer needed.

Run it with `npx vitest run src/config/__tests__/api-route-contract.test.ts`. The backend file comes from `SELFHELP_BACKEND_DIR` (default: the sibling `../sh-selfhelp_backend`); a missing file fails the test, it never skips. CI (`frontend-tests`) checks out the same-named backend branch, else `main`. When you add or change an endpoint, regenerate the backend file first if its route rows changed.

The lists in the test are explicit and each entry carries a reason: `bffOnly` (an entry the Next.js BFF answers or forwards; `backendPath` names the backend route whose rights it must have), `knownFailures` (a known mismatch that waits for a later fix, with its finding; it must keep failing, so the entry is removed when the cause is fixed), `unbuildable` and `methodOverrides`. Plugin host routes whose web right differs from the backend are known failures under F238.

## Benefits

- 🚀 **Performance**: No unnecessary network requests
- ⚡ **UX**: Instant feedback for permission-denied actions
- 🔒 **Security**: Defense-in-depth validation
- ⚙️ **Zero Config**: Works automatically with existing code
- 📝 **Type Safe**: Full TypeScript support

## Remember

**ALWAYS use `permissionAwareApiClient`** instead of `apiClient` for any backend API calls that require permissions. This ensures automatic permission validation and prevents unnecessary backend requests.
