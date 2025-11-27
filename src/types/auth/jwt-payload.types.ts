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
    timezone: {
        id: number | null;
        lookupCode: string | null;
        lookupValue: string | null;
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
    /** User's timezone ID */
    timezoneId: number | null;
    /** User's timezone lookup code */
    timezoneLookupCode: string | null;
    /** User's timezone display value */
    timezoneLookupValue: string | null;
}

/**
 * Permission constants - comprehensive list based on API permissions
 */
export const PERMISSIONS = {
    // Admin access
    ADMIN_ACCESS: 'admin.access',

    // Action translations
    ADMIN_ACTION_TRANSLATION_READ: 'admin.action_translation.read',

    // Actions (CRUD)
    ADMIN_ACTION_DELETE: 'admin.action.delete',
    ADMIN_ACTION_READ: 'admin.action.read',
    ADMIN_ACTION_UPDATE: 'admin.action.update',

    // Assets (CRUD)
    ADMIN_ASSET_CREATE: 'admin.asset.create',
    ADMIN_ASSET_DELETE: 'admin.asset.delete',
    ADMIN_ASSET_READ: 'admin.asset.read',

    // Audit
    ADMIN_AUDIT_VIEW: 'admin.audit.view',

    // Cache management
    ADMIN_CACHE_CLEAR: 'admin.cache.clear',
    ADMIN_CACHE_MANAGE: 'admin.cache.manage',
    ADMIN_CACHE_READ: 'admin.cache.read',

    // CMS Preferences
    ADMIN_CMS_PREFERENCES_READ: 'admin.cms_preferences.read',
    ADMIN_CMS_PREFERENCES_UPDATE: 'admin.cms_preferences.update',

    // Data operations
    ADMIN_DATA_DELETE: 'admin.data.delete',
    ADMIN_DATA_DELETE_COLUMNS: 'admin.data.delete_columns',
    ADMIN_DATA_READ: 'admin.data.read',

    // Group management
    ADMIN_GROUP_ACL: 'admin.group.acl',
    ADMIN_GROUP_CREATE: 'admin.group.create',
    ADMIN_GROUP_DELETE: 'admin.group.delete',
    ADMIN_GROUP_READ: 'admin.group.read',
    ADMIN_GROUP_UPDATE: 'admin.group.update',

    // Page version management
    ADMIN_PAGE_VERSION_COMPARE: 'admin.page_version.compare',
    ADMIN_PAGE_VERSION_CREATE: 'admin.page_version.create',
    ADMIN_PAGE_VERSION_PUBLISH: 'admin.page_version.publish',
    ADMIN_PAGE_VERSION_READ: 'admin.page_version.read',
    ADMIN_PAGE_VERSION_UNPUBLISH: 'admin.page_version.unpublish',

    // Pages (CRUD)
    ADMIN_PAGE_CREATE: 'admin.page.create',
    ADMIN_PAGE_DELETE: 'admin.page.delete',
    ADMIN_PAGE_EXPORT: 'admin.page.export',
    ADMIN_PAGE_INSERT: 'admin.page.insert',
    ADMIN_PAGE_READ: 'admin.page.read',
    ADMIN_PAGE_UPDATE: 'admin.page.update',

    // Permissions
    ADMIN_PERMISSION_READ: 'admin.permission.read',

    // Roles (CRUD)
    ADMIN_ROLE_CREATE: 'admin.role.create',
    ADMIN_ROLE_DELETE: 'admin.role.delete',
    ADMIN_ROLE_PERMISSIONS: 'admin.role.permissions',
    ADMIN_ROLE_READ: 'admin.role.read',
    ADMIN_ROLE_UPDATE: 'admin.role.update',

    // Scheduled jobs
    ADMIN_SCHEDULED_JOB_DELETE: 'admin.scheduled_job.delete',
    ADMIN_SCHEDULED_JOB_EXECUTE: 'admin.scheduled_job.execute',
    ADMIN_SCHEDULED_JOB_READ: 'admin.scheduled_job.read',

    // Sections
    ADMIN_SECTION_DELETE: 'admin.section.delete',

    // Settings
    ADMIN_SETTINGS: 'admin.settings',

    // User management
    ADMIN_USER_BLOCK: 'admin.user.block',
    ADMIN_USER_CREATE: 'admin.user.create',
    ADMIN_USER_DELETE: 'admin.user.delete',
    ADMIN_USER_IMPERSONATE: 'admin.user.impersonate',
    ADMIN_USER_READ: 'admin.user.read',
    ADMIN_USER_UNBLOCK: 'admin.user.unblock',
    ADMIN_USER_UPDATE: 'admin.user.update',
} as const;
