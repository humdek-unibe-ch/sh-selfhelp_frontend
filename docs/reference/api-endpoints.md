# API Endpoints Reference

> **Routing.** All endpoints are reached by the browser through the
> Next.js BFF proxy at `/api/*`, which forwards to Symfony at
> `/cms-api/v1/*`. The Symfony paths are listed below for reference;
> never call them directly from the browser. See
> [`docs/architecture/ssr-bff-architecture.md`](../architecture/ssr-bff-architecture.md)
> for the full lifecycle.

## Authentication Endpoints

| Method | Endpoint (Symfony)        | BFF route (browser-facing)              | Description                                            |
|--------|---------------------------|-----------------------------------------|--------------------------------------------------------|
| POST   | `/auth/login`             | `/api/auth/login`                       | User login with credentials. BFF sets `sh_auth` + `sh_refresh` httpOnly cookies; tokens are scrubbed from the response body. |
| POST   | `/auth/verify-2fa`        | `/api/auth/verify-2fa`                  | Verify 2FA code (uses `localStorage` `pending2FA` key only) |
| POST   | `/auth/refresh-token`     | `/api/auth/refresh` (proxy-only)        | Silent refresh — invoked by `src/proxy.ts` and the BFF retry loop, never by the browser directly. |
| POST   | `/auth/set-language`      | `/api/auth/set-language`                | Update language preference. New tokens (if returned in body) are converted to cookies by `rotateCookiesFromBodyIfPresent()`. |
| POST   | `/auth/logout`            | `/api/auth/logout`                      | User logout (clears `sh_auth` + `sh_refresh`).         |
| GET    | _(Mercure hub, dynamic)_  | `/api/auth/events` _(SSE)_              | Browser opens an `EventSource` to this BFF route. It reads `sh_auth`, asks Symfony for the Mercure discovery payload (`hubUrl`, `topic`, `token`), and pipes the upstream `text/event-stream` straight to the client. `useAclEventStream` invalidates `['user-data']` on `acl-changed` events, which cascades into the navigation / page-content caches. |

## Page Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pages/{keyword}` | Get public page content |
| GET | `/admin/pages` | Get all admin pages |
| POST | `/admin/pages` | Create new page |
| PUT | `/admin/pages/{keyword}` | Update page |
| DELETE | `/admin/pages/{keyword}` | Delete page |

## Section Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/pages/{keyword}/sections` | Get page sections |
| POST | `/admin/pages/{keyword}/sections` | Create page section |
| PUT | `/admin/sections/{id}` | Update section |
| DELETE | `/admin/sections/{id}` | Delete section |
| POST | `/admin/pages/{keyword}/sections/{parentId}/sections/create` | Create child section |

## User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | Get all users |
| POST | `/admin/users` | Create user |
| PUT | `/admin/users/{id}` | Update user |
| DELETE | `/admin/users/{id}` | Delete user |
| POST | `/admin/users/{id}/block` | Block/unblock user |

## Group & Permission Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/groups` | Get all groups |
| POST | `/admin/groups` | Create group |
| PUT | `/admin/groups/{id}` | Update group |
| GET | `/admin/groups/{id}/acls` | Get group ACLs |
| PUT | `/admin/groups/{id}/acls` | Update group ACLs |

## Asset Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/assets` | Get all assets |
| POST | `/admin/assets/upload` | Upload asset |
| DELETE | `/admin/assets/{id}` | Delete asset |

## AI / Section Generation

| Method | Endpoint                                     | Description |
|--------|----------------------------------------------|-------------|
| GET    | `/admin/ai/section-prompt-template`          | Returns the master prompt template (markdown, `Content-Type: text/markdown`) used by the "Copy AI prompt" button in the import-sections UI. The frontend sends `Accept: text/markdown` to opt into the markdown body. Mapped from `API_CONFIG.ENDPOINTS.ADMIN_AI_SECTION_PROMPT_TEMPLATE`. |
| POST   | `/admin/pages/{keyword}/sections/import`     | Import sections under a page from a JSON payload produced by the export flow. 422 responses are decomposed by `parseImportValidationErrors()` so the UI can highlight per-section / per-field problems. |
| POST   | `/admin/sections/{id}/sections/import`       | Import sections as children of an existing section. Same payload + error decomposition as the page-level variant. |

## Lookup Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/lookups` | Get all lookup data |
| GET | `/languages` | Get available languages |
| GET | `/frontend/css-classes` | Get available CSS classes |
| GET | `/frontend/groups-options` | Get groups for select fields |

## Cache Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/cache` | Get cache status |
| POST | `/admin/cache/clear` | Clear cache |
| POST | `/admin/cache/refresh` | Refresh cache |

---

**[Back to Main Guide](../COMPREHENSIVE_FRONTEND_GUIDE.md)**
