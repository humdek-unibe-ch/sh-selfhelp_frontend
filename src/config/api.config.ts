/**
 * API Configuration
 * Backend is running at http://localhost/selfhelp
 * Frontend is running at http://localhost:3000/Teilnahme
 */

import { PERMISSIONS } from "../types/auth/jwt-payload.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/symfony';

export const API_CONFIG = {
    BACKEND_URL: API_BASE_URL,
    BASE_URL: `${API_BASE_URL}/cms-api/v1`,
    ENDPOINTS: {
        // Authentication endpoints
        AUTH_LOGIN: {
            route: '/auth/login',
            permissions: []
        },
        TWO_FACTOR_VERIFY: {
            route: '/auth/two-factor-verify',
            permissions: []
        },
        AUTH_REFRESH_TOKEN: {
            route: '/auth/refresh-token',
            permissions: []
        },
        AUTH_LOGOUT: {
            route: '/auth/logout',
            permissions: []
        },
        AUTH_SET_LANGUAGE: {
            route: '/auth/set-language',
            permissions: []
        },
        AUTH_USER_DATA: {
            route: '/auth/user-data',
            permissions: []
        },

        // User profile management endpoints
        USER_UPDATE_USERNAME: {
            route: '/auth/user/username',
            permissions: []
        },
        USER_UPDATE_NAME: {
            route: '/auth/user/name',
            permissions: []
        },
        USER_UPDATE_PASSWORD: {
            route: '/auth/user/password',
            permissions: []
        },
        USER_DELETE_ACCOUNT: {
            route: '/auth/user/account',
            permissions: []
        },

        // User validation endpoints
        USER_VALIDATE_TOKEN: {
            route: (userId: number, token: string) => `/validate/${userId}/${token}`,
            permissions: []
        },
        USER_COMPLETE_VALIDATION: {
            route: (userId: number, token: string) => `/validate/${userId}/${token}/complete`,
            permissions: []
        },

        // Public pages endpoints
        /**
         * Fetches a list of pages when not logged in.
         * WARNING: When logged in, the backend returns a specific page's content (e.g., 'task' page sections),
         * NOT a list of pages. Use ALL_ROUTES for a consistent list of navigation routes.
         */
        PAGES_GET_ALL: {
            route: '/pages',
            permissions: []
        },
        PAGES_GET_ALL_WITH_LANGUAGE: {
            route: (languageId: number) => `/pages/language/${languageId}`,
            permissions: []
        },
        PAGES_GET_ONE: {
            route: (pageId: number) => `/pages/${pageId}`,
            permissions: []
        },

        // Public languages endpoint
        LANGUAGES: {
            route: '/languages',
            permissions: []
        },

        // Admin lookups endpoint
        ADMIN_LOOKUPS: {
            route: '/admin/lookups',
            permissions: [PERMISSIONS.ADMIN_ACCESS]
        },

        // Admin pages endpoints
        ADMIN_PAGES_GET_ALL: {
            route: '/admin/pages',
            permissions: [PERMISSIONS.ADMIN_PAGE_READ]
        },
        ADMIN_PAGES_GET_ALL_WITH_LANGUAGE: {
            route: (languageId: number) => `/admin/pages/language/${languageId}`,
            permissions: [PERMISSIONS.ADMIN_PAGE_READ]
        },
        ADMIN_PAGES_GET_ONE: {
            route: (pageId: number) => `/admin/pages/${pageId}`,
            permissions: [PERMISSIONS.ADMIN_PAGE_READ]
        },
        ADMIN_PAGES_CREATE: {
            route: '/admin/pages',
            permissions: [PERMISSIONS.ADMIN_PAGE_CREATE]
        },
        ADMIN_PAGES_UPDATE: {
            route: (pageId: number) => `/admin/pages/${pageId}`,
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },
        ADMIN_PAGES_DELETE: {
            route: (pageId: number) => `/admin/pages/${pageId}`,
            permissions: [PERMISSIONS.ADMIN_PAGE_DELETE]
        },
        ADMIN_PAGES_SECTIONS_GET: {
            route: (pageId: number) => `/admin/pages/${pageId}/sections`,
            permissions: [PERMISSIONS.ADMIN_PAGE_READ]
        },

        // Admin languages endpoints
        ADMIN_LANGUAGES_GET_ALL: {
            route: '/admin/languages',
            permissions: [PERMISSIONS.ADMIN_SETTINGS]
        },
        ADMIN_LANGUAGES_GET_ONE: {
            route: (id: number) => `/admin/languages/${id}`,
            permissions: [PERMISSIONS.ADMIN_SETTINGS]
        },
        ADMIN_LANGUAGES_CREATE: {
            route: '/admin/languages',
            permissions: [PERMISSIONS.ADMIN_SETTINGS]
        },
        ADMIN_LANGUAGES_UPDATE: {
            route: (id: number) => `/admin/languages/${id}`,
            permissions: [PERMISSIONS.ADMIN_SETTINGS]
        },
        ADMIN_LANGUAGES_DELETE: {
            route: (id: number) => `/admin/languages/${id}`,
            permissions: [PERMISSIONS.ADMIN_SETTINGS]
        },

        // Admin styles endpoints
        ADMIN_STYLES_GET_ALL: {
            route: '/admin/styles',
            permissions: []
        },

        // Admin CMS preferences endpoints
        ADMIN_CMS_PREFERENCES_GET: {
            route: '/admin/cms-preferences',
            permissions: [PERMISSIONS.ADMIN_CMS_PREFERENCES_READ]
        },
        ADMIN_CMS_PREFERENCES_UPDATE: {
            route: '/admin/cms-preferences',
            permissions: [PERMISSIONS.ADMIN_CMS_PREFERENCES_UPDATE]
        },

        // Admin assets endpoints
        ADMIN_ASSETS_GET_ALL: {
            route: '/admin/assets',
            permissions: [PERMISSIONS.ADMIN_ASSET_READ]
        },
        ADMIN_ASSETS_GET_ONE: {
            route: (assetId: number) => `/admin/assets/${assetId}`,
            permissions: [PERMISSIONS.ADMIN_ASSET_READ]
        },
        ADMIN_ASSETS_CREATE: {
            route: '/admin/assets',
            permissions: [PERMISSIONS.ADMIN_ASSET_CREATE]
        },
        ADMIN_ASSETS_DELETE: {
            route: (assetId: number) => `/admin/assets/${assetId}`,
            permissions: [PERMISSIONS.ADMIN_ASSET_DELETE]
        },

        // Admin users endpoints
        ADMIN_USERS_GET_ALL: {
            route: '/admin/users',
            permissions: [PERMISSIONS.ADMIN_USER_READ]
        },
        ADMIN_USERS_GET_ONE: {
            route: (userId: number) => `/admin/users/${userId}`,
            permissions: [PERMISSIONS.ADMIN_USER_READ]
        },
        ADMIN_USERS_CREATE: {
            route: '/admin/users',
            permissions: [PERMISSIONS.ADMIN_USER_CREATE]
        },
        ADMIN_USERS_UPDATE: {
            route: (userId: number) => `/admin/users/${userId}`,
            permissions: [PERMISSIONS.ADMIN_USER_UPDATE]
        },
        ADMIN_USERS_DELETE: {
            route: (userId: number) => `/admin/users/${userId}`,
            permissions: [PERMISSIONS.ADMIN_USER_DELETE]
        },
        ADMIN_USERS_BLOCK: {
            route: (userId: number) => `/admin/users/${userId}/block`,
            permissions: [PERMISSIONS.ADMIN_USER_BLOCK]
        },
        ADMIN_USERS_GROUPS_GET: {
            route: (userId: number) => `/admin/users/${userId}/groups`,
            permissions: []
        },
        ADMIN_USERS_GROUPS_ADD: {
            route: (userId: number) => `/admin/users/${userId}/groups`,
            permissions: []
        },
        ADMIN_USERS_GROUPS_REMOVE: {
            route: (userId: number) => `/admin/users/${userId}/groups`,
            permissions: []
        },
        ADMIN_USERS_ROLES_GET: {
            route: (userId: number) => `/admin/users/${userId}/roles`,
            permissions: []
        },
        ADMIN_USERS_ROLES_ADD: {
            route: (userId: number) => `/admin/users/${userId}/roles`,
            permissions: []
        },
        ADMIN_USERS_ROLES_REMOVE: {
            route: (userId: number) => `/admin/users/${userId}/roles`,
            permissions: []
        },
        ADMIN_USERS_SEND_ACTIVATION: {
            route: (userId: number) => `/admin/users/${userId}/send-activation-mail`,
            permissions: []
        },
        ADMIN_USERS_CLEAN_DATA: {
            route: (userId: number) => `/admin/users/${userId}/clean-data`,
            permissions: []
        },
        ADMIN_USERS_IMPERSONATE: {
            route: (userId: number) => `/admin/users/${userId}/impersonate`,
            permissions: [PERMISSIONS.ADMIN_USER_IMPERSONATE]
        },

        // Admin groups endpoints (only paginated endpoint exists)
        ADMIN_GROUPS_GET_ALL: {
            route: '/admin/groups',
            permissions: [PERMISSIONS.ADMIN_GROUP_READ]
        },
        ADMIN_GROUPS_GET_ONE: {
            route: (groupId: number) => `/admin/groups/${groupId}`,
            permissions: [PERMISSIONS.ADMIN_GROUP_READ]
        },
        ADMIN_GROUPS_CREATE: {
            route: '/admin/groups',
            permissions: [PERMISSIONS.ADMIN_GROUP_CREATE]
        },
        ADMIN_GROUPS_UPDATE: {
            route: (groupId: number) => `/admin/groups/${groupId}`,
            permissions: [PERMISSIONS.ADMIN_GROUP_UPDATE]
        },
        ADMIN_GROUPS_DELETE: {
            route: (groupId: number) => `/admin/groups/${groupId}`,
            permissions: [PERMISSIONS.ADMIN_GROUP_DELETE]
        },
        ADMIN_GROUPS_ACLS_GET: {
            route: (groupId: number) => `/admin/groups/${groupId}/acls`,
            permissions: [PERMISSIONS.ADMIN_GROUP_READ]
        },
        ADMIN_GROUPS_ACLS_UPDATE: {
            route: (groupId: number) => `/admin/groups/${groupId}/acls`,
            permissions: [PERMISSIONS.ADMIN_GROUP_ACL]
        },

        // Admin roles endpoints (only paginated endpoint exists)
        ADMIN_ROLES_GET_ALL: {
            route: '/admin/roles',
            permissions: [PERMISSIONS.ADMIN_ROLE_READ]
        },
        ADMIN_ROLES_GET_ONE: {
            route: (roleId: number) => `/admin/roles/${roleId}`,
            permissions: [PERMISSIONS.ADMIN_ROLE_READ]
        },
        ADMIN_ROLES_CREATE: {
            route: '/admin/roles',
            permissions: [PERMISSIONS.ADMIN_ROLE_CREATE]
        },
        ADMIN_ROLES_UPDATE: {
            route: (roleId: number) => `/admin/roles/${roleId}`,
            permissions: [PERMISSIONS.ADMIN_ROLE_UPDATE]
        },
        ADMIN_ROLES_DELETE: {
            route: (roleId: number) => `/admin/roles/${roleId}`,
            permissions: [PERMISSIONS.ADMIN_ROLE_DELETE]
        },
        ADMIN_ROLES_PERMISSIONS_GET: {
            route: (roleId: number) => `/admin/roles/${roleId}/permissions`,
            permissions: [PERMISSIONS.ADMIN_ROLE_READ]
        },
        ADMIN_ROLES_PERMISSIONS_ADD: {
            route: (roleId: number) => `/admin/roles/${roleId}/permissions`,
            permissions: [PERMISSIONS.ADMIN_ROLE_PERMISSIONS]
        },
        ADMIN_ROLES_PERMISSIONS_REMOVE: {
            route: (roleId: number) => `/admin/roles/${roleId}/permissions`,
            permissions: [PERMISSIONS.ADMIN_ROLE_PERMISSIONS]
        },
        ADMIN_ROLES_PERMISSIONS_UPDATE: {
            route: (roleId: number) => `/admin/roles/${roleId}/permissions`,
            permissions: [PERMISSIONS.ADMIN_ROLE_PERMISSIONS]
        },

        // Admin permissions endpoints
        ADMIN_PERMISSIONS_GET_ALL: {
            route: '/admin/permissions',
            permissions: [PERMISSIONS.ADMIN_PERMISSION_READ]
        },

        // Admin actions endpoints
        ADMIN_ACTIONS_GET_ALL: {
            route: '/admin/actions',
            permissions: [PERMISSIONS.ADMIN_ACTION_READ]
        },
        ADMIN_ACTIONS_CREATE: {
            route: '/admin/actions',
            permissions: [PERMISSIONS.ADMIN_ACTION_CREATE]
        },
        ADMIN_ACTIONS_GET_ONE: {
            route: (actionId: number) => `/admin/actions/${actionId}`,
            permissions: [PERMISSIONS.ADMIN_ACTION_READ]
        },
        ADMIN_ACTIONS_UPDATE: {
            route: (actionId: number) => `/admin/actions/${actionId}`,
            permissions: [PERMISSIONS.ADMIN_ACTION_UPDATE]
        },
        ADMIN_ACTIONS_DELETE: {
            route: (actionId: number) => `/admin/actions/${actionId}`,
            permissions: [PERMISSIONS.ADMIN_ACTION_DELETE]
        },
        ADMIN_ACTIONS_TRANSLATIONS_GET_ALL: {
            route: (actionId: number) => `/admin/actions/${actionId}/translations`,
            permissions: [PERMISSIONS.ADMIN_ACTION_TRANSLATION_READ]
        },

        // Frontend CSS classes endpoint
        FRONTEND_CSS_CLASSES_GET_ALL: {
            route: '/frontend/css-classes',
            permissions: []
        },

        // Admin scheduled jobs endpoints
        ADMIN_SCHEDULED_JOBS_GET_ALL: {
            route: '/admin/scheduled-jobs',
            permissions: [PERMISSIONS.ADMIN_SCHEDULED_JOB_READ]
        },
        ADMIN_SCHEDULED_JOBS_GET_ONE: {
            route: (jobId: number) => `/admin/scheduled-jobs/${jobId}`,
            permissions: [PERMISSIONS.ADMIN_SCHEDULED_JOB_READ]
        },
        ADMIN_SCHEDULED_JOBS_EXECUTE: {
            route: (jobId: number) => `/admin/scheduled-jobs/${jobId}/execute`,
            permissions: [PERMISSIONS.ADMIN_SCHEDULED_JOB_EXECUTE]
        },
        ADMIN_SCHEDULED_JOBS_DELETE: {
            route: (jobId: number) => `/admin/scheduled-jobs/${jobId}`,
            permissions: [PERMISSIONS.ADMIN_SCHEDULED_JOB_DELETE]
        },
        ADMIN_SCHEDULED_JOBS_TRANSACTIONS: {
            route: (jobId: number) => `/admin/scheduled-jobs/${jobId}/transactions`,
            permissions: [PERMISSIONS.ADMIN_SCHEDULED_JOB_READ]
        },

        // Admin page keywords endpoints
        ADMIN_PAGE_KEYWORDS_GET_ALL: {
            route: '/admin/page-keywords',
            permissions: [PERMISSIONS.ADMIN_PAGE_READ]
        },

        // Admin page versioning endpoints
        ADMIN_PAGE_VERSIONS_PUBLISH: {
            route: (pageId: number) => `/admin/pages/${pageId}/versions/publish`,
            permissions: [PERMISSIONS.ADMIN_PAGE_VERSION_PUBLISH]
        },
        ADMIN_PAGE_VERSIONS_PUBLISH_SPECIFIC: {
            route: (pageId: number, versionId: number) => `/admin/pages/${pageId}/versions/${versionId}/publish`,
            permissions: [PERMISSIONS.ADMIN_PAGE_VERSION_PUBLISH]
        },
        ADMIN_PAGE_VERSIONS_UNPUBLISH: {
            route: (pageId: number) => `/admin/pages/${pageId}/versions/unpublish`,
            permissions: [PERMISSIONS.ADMIN_PAGE_VERSION_PUBLISH]
        },
        ADMIN_PAGE_VERSIONS_LIST: {
            route: (pageId: number) => `/admin/pages/${pageId}/versions`,
            permissions: [PERMISSIONS.ADMIN_PAGE_VERSION_READ]
        },
        ADMIN_PAGE_VERSIONS_GET_ONE: {
            route: (pageId: number, versionId: number) => `/admin/pages/${pageId}/versions/${versionId}`,
            permissions: [PERMISSIONS.ADMIN_PAGE_VERSION_READ]
        },
        ADMIN_PAGE_VERSIONS_DELETE: {
            route: (pageId: number, versionId: number) => `/admin/pages/${pageId}/versions/${versionId}`,
            permissions: []
        },
        ADMIN_PAGE_VERSIONS_COMPARE_DRAFT: {
            route: (pageId: number, versionId: number) => `/admin/pages/${pageId}/versions/compare-draft/${versionId}`,
            permissions: [PERMISSIONS.ADMIN_PAGE_VERSION_COMPARE]
        },
        ADMIN_PAGE_VERSIONS_HAS_CHANGES: {
            route: (pageId: number) => `/admin/pages/${pageId}/versions/has-changes`,
            permissions: [PERMISSIONS.ADMIN_PAGE_VERSION_READ]
        },
        ADMIN_PAGE_VERSIONS_COMPARE: {
            route: (pageId: number, version1Id: number, version2Id: number) => `/admin/pages/${pageId}/versions/compare/${version1Id}/${version2Id}`,
            permissions: [PERMISSIONS.ADMIN_PAGE_VERSION_COMPARE]
        },
        ADMIN_PAGE_VERSIONS_RESTORE_FROM_VERSION: {
            route: (pageId: number, versionId: number) => `/admin/pages/${pageId}/sections/restore-from-version/${versionId}`,
            permissions: [PERMISSIONS.ADMIN_PAGE_EXPORT]
        },

        // Admin cache endpoints
        ADMIN_CACHE_STATS: {
            route: '/admin/cache/stats',
            permissions: [PERMISSIONS.ADMIN_CACHE_READ]
        },
        ADMIN_CACHE_CLEAR_ALL: {
            route: '/admin/cache/clear',
            permissions: [PERMISSIONS.ADMIN_CACHE_CLEAR]
        },
        ADMIN_CACHE_CLEAR_CATEGORY: {
            route: '/admin/cache/clear',
            permissions: [PERMISSIONS.ADMIN_CACHE_CLEAR]
        },
        ADMIN_CACHE_CLEAR_USER: {
            route: '/admin/cache/clear',
            permissions: [PERMISSIONS.ADMIN_CACHE_CLEAR]
        },
        ADMIN_CACHE_RESET_STATS: {
            route: '/admin/cache/reset-stats',
            permissions: [PERMISSIONS.ADMIN_CACHE_MANAGE]
        },
        ADMIN_CACHE_HEALTH: {
            route: '/admin/cache/health',
            permissions: [PERMISSIONS.ADMIN_CACHE_READ]
        },
        ADMIN_CACHE_CLEAR_API_ROUTES: {
            route: '/admin/cache/clear-api-routes',
            permissions: [PERMISSIONS.ADMIN_CACHE_CLEAR]
        },

        // Admin section utility endpoints
        ADMIN_SECTIONS_GET_REF_CONTAINERS: {
            route: '/admin/sections/ref-containers',
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },
        ADMIN_SECTIONS_UNUSED_GET: {
            route: '/admin/sections/unused',
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },
        ADMIN_SECTIONS_UNUSED_DELETE: {
            route: (sectionId: number) => `/admin/sections/unused/${sectionId}`,
            permissions: [PERMISSIONS.ADMIN_SECTION_DELETE]
        },
        ADMIN_SECTIONS_UNUSED_DELETE_ALL: {
            route: '/admin/sections/unused',
            permissions: [PERMISSIONS.ADMIN_SECTION_DELETE]
        },
        ADMIN_SECTIONS_FORCE_DELETE: {
            route: (pageId: number, sectionId: number) => `/admin/pages/${pageId}/sections/${sectionId}/force-delete`,
            permissions: [PERMISSIONS.ADMIN_PAGE_DELETE]
        },

        // Admin data management endpoints
        ADMIN_DATA_TABLES_LIST: {
            route: '/admin/data/tables',
            permissions: [PERMISSIONS.ADMIN_DATA_READ]
        },
        ADMIN_DATA_ROWS_GET: {
            route: '/admin/data',
            permissions: [PERMISSIONS.ADMIN_DATA_READ]
        },
        ADMIN_DATA_TABLE_COLUMNS_GET: {
            route: (tableName: string) => `/admin/data/tables/${tableName}/columns`,
            permissions: [PERMISSIONS.ADMIN_DATA_READ]
        },
        ADMIN_DATA_TABLE_COLUMN_NAMES_GET: {
            route: (tableName: string) => `/admin/data/tables/${tableName}/column-names`,
            permissions: [PERMISSIONS.ADMIN_DATA_READ]
        },
        ADMIN_DATA_TABLE_COLUMNS_DELETE: {
            route: (tableName: string) => `/admin/data/tables/${tableName}/columns`,
            permissions: [PERMISSIONS.ADMIN_DATA_DELETE_COLUMNS]
        },
        ADMIN_DATA_RECORD_DELETE: {
            route: (recordId: number) => `/admin/data/records/${recordId}`,
            permissions: [PERMISSIONS.ADMIN_DATA_DELETE]
        },
        ADMIN_DATA_TABLE_DELETE: {
            route: (tableName: string) => `/admin/data/tables/${tableName}`,
            permissions: [PERMISSIONS.ADMIN_DATA_DELETE]
        },

        // Form submission endpoints (public access)
        FORMS_SUBMIT: {
            route: '/forms/submit',
            permissions: []
        },
        FORMS_UPDATE: {
            route: '/forms/update',
            permissions: []
        },
        FORMS_DELETE: {
            route: '/forms/delete',
            permissions: []
        },

        // Admin section creation endpoints
        ADMIN_PAGES_CREATE_SECTION: {
            route: (pageId: number) => `/admin/pages/${pageId}/sections/create`,
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },
        ADMIN_SECTIONS_CREATE_CHILD: {
            route: (pageId: number, parentSectionId: number) => `/admin/pages/${pageId}/sections/${parentSectionId}/sections/create`,
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },

        // Admin section management endpoints
        ADMIN_PAGES_ADD_SECTION: {
            route: (pageId: number) => `/admin/pages/${pageId}/sections`,
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },
        ADMIN_PAGES_REMOVE_SECTION: {
            route: (pageId: number, sectionId: number) => `/admin/pages/${pageId}/sections/${sectionId}`,
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },
        ADMIN_SECTIONS_ADD: {
            route: (pageId: number, parentSectionId: number) => `/admin/pages/${pageId}/sections/${parentSectionId}/sections`,
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },
        ADMIN_SECTIONS_REMOVE: {
            route: (pageId: number, parentSectionId: number, childSectionId: number) => `/admin/pages/${pageId}/sections/${parentSectionId}/sections/${childSectionId}`,
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },
        ADMIN_SECTIONS_UPDATE: {
            route: (pageId: number, sectionId: number) => `/admin/pages/${pageId}/sections/${sectionId}`,
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },
        ADMIN_SECTIONS_GET_ONE: {
            route: (pageId: number, sectionId: number) => `/admin/pages/${pageId}/sections/${sectionId}`,
            permissions: []
        },
        ADMIN_SECTIONS_GET_CHILDREN: {
            route: (pageId: number, parentSectionId: number) => `/admin/pages/${pageId}/sections/${parentSectionId}/sections`,
            permissions: []
        },

        // Admin section export/import endpoints
        ADMIN_SECTIONS_EXPORT_PAGE: {
            route: (pageId: number) => `/admin/pages/${pageId}/sections/export`,
            permissions: [PERMISSIONS.ADMIN_PAGE_EXPORT]
        },
        ADMIN_SECTIONS_EXPORT_SECTION: {
            route: (pageId: number, sectionId: number) => `/admin/pages/${pageId}/sections/${sectionId}/export`,
            permissions: [PERMISSIONS.ADMIN_PAGE_EXPORT]
        },
        ADMIN_SECTIONS_IMPORT_TO_PAGE: {
            route: (pageId: number) => `/admin/pages/${pageId}/sections/import`,
            permissions: [PERMISSIONS.ADMIN_PAGE_EXPORT]
        },
        ADMIN_SECTIONS_IMPORT_TO_SECTION: {
            route: (pageId: number, parentSectionId: number) => `/admin/pages/${pageId}/sections/${parentSectionId}/import`,
            permissions: [PERMISSIONS.ADMIN_PAGE_EXPORT]
        },

        // Admin data access management endpoints
        ADMIN_DATA_ACCESS_ROLES_LIST: {
            route: '/admin/data-access/roles',
            permissions: [PERMISSIONS.ADMIN_ROLE_READ, PERMISSIONS.ADMIN_ROLE_UPDATE]
        },
        ADMIN_DATA_ACCESS_ROLE_EFFECTIVE_PERMISSIONS: {
            route: (roleId: number) => `/admin/data-access/roles/${roleId}/effective-permissions`,
            permissions: [PERMISSIONS.ADMIN_ROLE_READ, PERMISSIONS.ADMIN_ROLE_UPDATE]
        },
        ADMIN_DATA_ACCESS_ROLE_PERMISSIONS_SET: {
            route: (roleId: number) => `/admin/data-access/roles/${roleId}/permissions`,
            permissions: [PERMISSIONS.ADMIN_ROLE_READ, PERMISSIONS.ADMIN_ROLE_UPDATE]
        },

        // Admin audit management endpoints
        ADMIN_AUDIT_DATA_ACCESS_LIST: {
            route: '/admin/audit/data-access',
            permissions: [PERMISSIONS.ADMIN_AUDIT_VIEW]
        },
        ADMIN_AUDIT_DATA_ACCESS_DETAIL: {
            route: (auditId: number) => `/admin/audit/data-access/${auditId}`,
            permissions: [PERMISSIONS.ADMIN_AUDIT_VIEW]
        },
        ADMIN_AUDIT_DATA_ACCESS_STATS: {
            route: '/admin/audit/data-access/stats',
            permissions: [PERMISSIONS.ADMIN_AUDIT_VIEW]
        },

        // Legacy endpoints (keeping for backward compatibility)
        PAGES_GET_ONE_WITH_LANGUAGE: {
            route: (pageId: number, languageId: number) => `/pages/${pageId}?language_id=${languageId}`,
            permissions: []
        },
        ADMIN_PAGES_GET_ONE_WITH_LANGUAGE: {
            route: (pageId: number, languageId: number) => `/admin/pages/${pageId}?language_id=${languageId}`,
            permissions: [PERMISSIONS.ADMIN_PAGE_READ]
        },
        ADMIN_SETTINGS: {
            route: '/admin/settings',
            permissions: [PERMISSIONS.ADMIN_SETTINGS]
        },

        // Deprecated endpoints (marked for removal)
        ADMIN_SECTIONS_ADD_TO_PAGE: {
            route: (pageId: number) => `/admin/pages/${pageId}/sections`,
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },
        ADMIN_SECTIONS_ADD_TO_SECTION: {
            route: (pageId: number, parentSectionId: number) => `/admin/pages/${pageId}/sections/${parentSectionId}/sections`,
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },
        ADMIN_SECTIONS_UPDATE_SECTION: {
            route: (pageId: number, sectionId: number) => `/admin/pages/${pageId}/sections/${sectionId}`,
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },
        ADMIN_SECTIONS_REMOVE_FROM_SECTION: {
            route: (pageId: number, parentSectionId: number, childSectionId: number) => `/admin/pages/${pageId}/sections/${parentSectionId}/sections/${childSectionId}`,
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },
        ADMIN_SECTIONS_DELETE: {
            route: (pageId: number, sectionId: number) => `/admin/pages/${pageId}/sections/${sectionId}`,
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },
        ADMIN_PAGES_SECTIONS_CREATE: {
            route: (pageId: number) => `/admin/pages/${pageId}/sections/create`,
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },
        ADMIN_SECTIONS_CREATE_IN_SECTION: {
            route: (pageId: number, parentSectionId: number) => `/admin/pages/${pageId}/sections/${parentSectionId}/sections/create`,
            permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE]
        },
        USER_LANGUAGE_PREFERENCE: {
            route: '/auth/set-language',
            permissions: []
        }
    },
    CORS_CONFIG: {
        credentials: true, // Required for cookies, authorization headers with HTTPS
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Client-Type': 'web'
        },
    },
    TIMEOUT: 10000, // 10 seconds
    TOKEN_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes in milliseconds
    TOKEN_EXPIRY_THRESHOLD: 60 * 1000, // 1 minute in milliseconds
};