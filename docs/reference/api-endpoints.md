/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
# API Endpoints Reference

Audience: Developers and integrators.
Status: active.
Applies to: SelfHelp2 Next.js frontend.
Last verified: 2026-06-03.
Source of truth: Controllers, JSON schemas, route definitions, and exported types in this repository.

> **Routing.** All endpoints are reached by the browser through the
> Next.js BFF proxy at `/api/*`, which forwards to Symfony at
> `/cms-api/v1/*`. The Symfony paths are listed below for reference;
> never call them directly from the browser. See
> [`docs/architecture/ssr-bff-architecture.md`](../developer/ssr-bff-architecture.md)
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

## Registration Codes

Invitation codes required for user registration when the `register` style has `open_registration = '0'`. Each code is bound to a group; once consumed during registration the new user is added to that group. Managed under **User Management → Registration Codes** in the admin navbar.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/admin/registration-codes`          | List registration codes (paginated). Supports `search`, `id_groups`, `status` (`available` \| `used`), `sort` (`created_at` \| `consumed_at`), `sortDirection`, `page`, `pageSize`. Response includes `codes`, `pagination`, and a `config` object (`{ generate_min, generate_max }`) that drives the generate form bounds — do not hardcode these on the frontend. |
| POST   | `/admin/registration-codes/generate` | Bulk-generate registration codes. Body: `{ count: number, id_groups: number }`. `count` must be within `config.generate_min`–`config.generate_max`. Code length (8 chars, alphanumeric) is fixed server-side. Returns 422 with a human-readable `error` string when the table capacity would be exceeded or `count` is out of range. |
| GET    | `/admin/registration-codes/export`   | Export all matching codes as CSV. Accepts the same filters as the list endpoint (`search`, `id_groups`, `status`) but returns all rows without pagination. Response is `text/csv`. |

Permissions: `admin.registration_code.read`, `admin.registration_code.create`.

## Data Browser

Browse and manage form-submission data per table under **Data Management** in the admin navbar. Tables are created implicitly by the backend (a form section is created, or data is first written) — there is no create endpoint. Frontend reads tables by name and drives all delete/export from `DataAdminPage` + `SingleDataTable`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/admin/data/tables` | List data tables the current user can access. |
| GET    | `/admin/data` | Get rows for a table. Query: `table_name` (required), `user_id`, `exclude_deleted`, `language_id`. |
| GET    | `/admin/data/tables/{name}/columns` | List columns (`{ id, name }`) for a table. |
| GET    | `/admin/data/tables/{name}/column-names` | List column names only. |
| DELETE | `/admin/data/records/{recordId}` | Delete one row. **Requires** `?table_name=<name>`. |
| DELETE | `/admin/data/tables/{name}/columns` | Delete columns. Body: `{ columns: string[] }`. |
| DELETE | `/admin/data/tables/{name}` | Delete an entire table. |
| GET    | `/admin/data/tables/{name}/export` | Export one table. Query: `format` (`csv` \| `json`), plus the same `user_id` / `language_id` / `exclude_deleted` filters as the rows endpoint. **Returns a raw blob** (`text/csv` or `application/json`), **not** the standard envelope. |
| POST   | `/admin/data/tables/bulk-export` | Export several tables as a single ZIP. Body: `{ table_names: string[], format: 'csv' \| 'json', user_id?, language_id?, exclude_deleted? }`. **Returns an `application/zip` blob**, not the envelope. |

Permissions: `admin.data.read`, `admin.data.delete`, `admin.data.delete_columns`. Export endpoints reuse `admin.data.read`.

> **Blob contract:** the two export endpoints (and `/admin/registration-codes/export`) are the data endpoints that bypass the Symfony `{status,message,data,...}` envelope. The browser reads them with axios `responseType: 'blob'` and triggers the download via `downloadBlobFile()` in `src/utils/export-import.utils.ts`. Do not try to unwrap `response.data.data` for these.

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

**[Back to Main Guide](../archive/comprehensive-frontend-guide.md)**
