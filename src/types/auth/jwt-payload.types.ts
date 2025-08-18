/**
 * JWT token payload structure returned from the backend after successful authentication
 * Updated structure - no longer contains permissions, language, or detailed user info
 */
export interface IJwtPayload {
    /** Token issued at timestamp */
    iat: number;
    /** Token expiration timestamp */
    exp: number;
    /** User roles array (simplified to role names only) */
    roles: string[];
    /** User ID */
    id_users: number;
    /** User email */
    email: string;
    /** User name */
    user_name: string;
    /** Username (nullable) */
    username: string | null;
}

/**
 * User data response structure from /auth/user-data endpoint
 */
export interface IUserDataResponse {
    status: number;
    message: string;
    error: string | null;
    logged_in: boolean;
    meta: {
        version: string;
        timestamp: string;
    };
    data: IUserData;
}

/**
 * User data structure containing full user information
 */
export interface IUserData {
    id: number;
    email: string;
    name: string | null;
    user_name: string | null;
    blocked: boolean;
    language: {
        id: number | null;
        locale: string | null;
        name: string | null;
    };
    roles: Array<{
        id: number;
        name: string;
        description: string | null;
    }>;
    permissions: string[];
    groups: Array<{
        id: number;
        name: string;
        description: string | null;
    }>;
}

/**
 * Extended user interface that includes roles and permissions from user-data endpoint
 * This replaces the JWT-based user data
 */
export interface IAuthUser {
    id: number;
    email: string;
    name: string;
    user_name: string | null;
    blocked: boolean;
    roles: Array<{
        id: number;
        name: string;
        description: string | null;
    }>;
    permissions: string[];
    groups: Array<{
        id: number;
        name: string;
        description: string | null;
    }>;
    /** User's preferred language ID */
    languageId: number | null;
    /** User's preferred language locale */
    languageLocale: string | null;
    /** User's preferred language name */
    languageName: string | null;
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
