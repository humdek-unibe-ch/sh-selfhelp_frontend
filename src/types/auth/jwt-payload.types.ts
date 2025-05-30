/**
 * JWT token payload structure returned from the backend after successful authentication
 */
export interface IJwtPayload {
    /** Token issued at timestamp */
    iat: number;
    /** Token expiration timestamp */
    exp: number;
    /** User roles array */
    roles: string[];
    /** User permissions array */
    permissions: string[];
    /** User ID */
    id_users: number;
    /** User email */
    email: string;
    /** User name (same as email in this case) */
    user_name: string;
    /** Username (same as email in this case) */
    username: string;
}

/**
 * Extended user interface that includes roles and permissions from JWT
 */
export interface IAuthUser {
    id: number;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
}

/**
 * Permission constants
 */
export const PERMISSIONS = {
    ADMIN_ACCESS: 'admin.access',
    ADMIN_PAGE_READ: 'admin.page.read',
    ADMIN_PAGE_CREATE: 'admin.page.create',
    ADMIN_PAGE_UPDATE: 'admin.page.update',
    ADMIN_PAGE_DELETE: 'admin.page.delete',
    ADMIN_PAGE_INSERT: 'admin.page.insert',
} as const;

/**
 * Role constants
 */
export const ROLES = {
    ADMIN: 'admin',
} as const;
