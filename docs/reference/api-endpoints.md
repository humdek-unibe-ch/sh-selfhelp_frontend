# API Endpoints Reference

## Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login with credentials |
| POST | `/auth/verify-2fa` | Verify 2FA code |
| POST | `/auth/refresh-token` | Refresh JWT tokens |
| POST | `/auth/set-language` | Update language preference |
| POST | `/auth/logout` | User logout |

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
