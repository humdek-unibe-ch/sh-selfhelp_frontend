/**
 * API Configuration
 * Backend is running at http://localhost/selfhelp
 * Frontend is running at http://localhost:3000/Teilnahme
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_CONFIG = {
    BASE_URL: `${API_BASE_URL}/cms-api/v1`,
    ENDPOINTS: {
        // Authentication endpoints
        AUTH_LOGIN: '/auth/login',
        TWO_FACTOR_VERIFY: '/auth/two-factor-verify',
        AUTH_REFRESH_TOKEN: '/auth/refresh-token',
        AUTH_LOGOUT: '/auth/logout',
        AUTH_SET_LANGUAGE: '/auth/set-language',
        
        // Public pages endpoints
        /**
         * Fetches a list of pages when not logged in.
         * WARNING: When logged in, the backend returns a specific page's content (e.g., 'task' page sections),
         * NOT a list of pages. Use ALL_ROUTES for a consistent list of navigation routes.
         */
        PAGES_GET_ALL: '/pages',
        PAGES_GET_ALL_WITH_LANGUAGE: (languageId: number) => `/pages/${languageId}`,
        PAGES_GET_ONE: (keyword: string) => `/pages/${keyword}`,
        
        // Public languages endpoint
        LANGUAGES: '/languages',
        
        // Admin lookups endpoint
        ADMIN_LOOKUPS: '/admin/lookups',
        
        // Admin pages endpoints
        ADMIN_PAGES_GET_ALL: '/admin/pages',
        ADMIN_PAGES_GET_ALL_WITH_LANGUAGE: (languageId: number) => `/admin/pages/${languageId}`,
        ADMIN_PAGES_GET_ONE: (keyword: string) => `/admin/pages/${keyword}`,
        ADMIN_PAGES_CREATE: '/admin/pages',
        ADMIN_PAGES_UPDATE: (keyword: string) => `/admin/pages/${keyword}`,
        ADMIN_PAGES_DELETE: (keyword: string) => `/admin/pages/${keyword}`,
        ADMIN_PAGES_SECTIONS_GET: (keyword: string) => `/admin/pages/${keyword}/sections`,
        
        // Admin languages endpoints
        ADMIN_LANGUAGES_GET_ALL: '/admin/languages',
        ADMIN_LANGUAGES_GET_ONE: (id: number) => `/admin/languages/${id}`,
        ADMIN_LANGUAGES_CREATE: '/admin/languages',
        ADMIN_LANGUAGES_UPDATE: (id: number) => `/admin/languages/${id}`,
        ADMIN_LANGUAGES_DELETE: (id: number) => `/admin/languages/${id}`,
        
        // Admin styles endpoints
        ADMIN_STYLES_GET_ALL: '/admin/styles',

        // Admin users endpoints
        ADMIN_USERS_GET_ALL: '/admin/users',
        ADMIN_USERS_GET_ONE: (userId: number) => `/admin/users/${userId}`,
        ADMIN_USERS_CREATE: '/admin/users',
        ADMIN_USERS_UPDATE: (userId: number) => `/admin/users/${userId}`,
        ADMIN_USERS_DELETE: (userId: number) => `/admin/users/${userId}`,
        ADMIN_USERS_BLOCK: (userId: number) => `/admin/users/${userId}/block`,
        ADMIN_USERS_GROUPS_GET: (userId: number) => `/admin/users/${userId}/groups`,
        ADMIN_USERS_GROUPS_ADD: (userId: number) => `/admin/users/${userId}/groups`,
        ADMIN_USERS_GROUPS_REMOVE: (userId: number) => `/admin/users/${userId}/groups`,
        ADMIN_USERS_ROLES_GET: (userId: number) => `/admin/users/${userId}/roles`,
        ADMIN_USERS_ROLES_ADD: (userId: number) => `/admin/users/${userId}/roles`,
        ADMIN_USERS_ROLES_REMOVE: (userId: number) => `/admin/users/${userId}/roles`,
        ADMIN_USERS_SEND_ACTIVATION: (userId: number) => `/admin/users/${userId}/send-activation-mail`,
        ADMIN_USERS_CLEAN_DATA: (userId: number) => `/admin/users/${userId}/clean-data`,
        ADMIN_USERS_IMPERSONATE: (userId: number) => `/admin/users/${userId}/impersonate`,

        // Admin groups endpoints (only paginated endpoint exists)
        ADMIN_GROUPS_GET_ALL: '/admin/groups',
        ADMIN_GROUPS_GET_ONE: (groupId: number) => `/admin/groups/${groupId}`,
        ADMIN_GROUPS_CREATE: '/admin/groups',
        ADMIN_GROUPS_UPDATE: (groupId: number) => `/admin/groups/${groupId}`,
        ADMIN_GROUPS_DELETE: (groupId: number) => `/admin/groups/${groupId}`,
        ADMIN_GROUPS_ACLS_GET: (groupId: number) => `/admin/groups/${groupId}/acls`,
        ADMIN_GROUPS_ACLS_UPDATE: (groupId: number) => `/admin/groups/${groupId}/acls`,

        // Admin roles endpoints (only paginated endpoint exists)
        ADMIN_ROLES_GET_ALL: '/admin/roles',
        ADMIN_ROLES_GET_ONE: (roleId: number) => `/admin/roles/${roleId}`,
        ADMIN_ROLES_CREATE: '/admin/roles',
        ADMIN_ROLES_UPDATE: (roleId: number) => `/admin/roles/${roleId}`,
        ADMIN_ROLES_DELETE: (roleId: number) => `/admin/roles/${roleId}`,
        ADMIN_ROLES_PERMISSIONS_GET: (roleId: number) => `/admin/roles/${roleId}/permissions`,
        ADMIN_ROLES_PERMISSIONS_ADD: (roleId: number) => `/admin/roles/${roleId}/permissions`,
        ADMIN_ROLES_PERMISSIONS_REMOVE: (roleId: number) => `/admin/roles/${roleId}/permissions`,
        ADMIN_ROLES_PERMISSIONS_UPDATE: (roleId: number) => `/admin/roles/${roleId}/permissions`,
        
        // Admin section creation endpoints
        ADMIN_PAGES_CREATE_SECTION: (keyword: string) => `/admin/pages/${keyword}/sections/create`,
        ADMIN_SECTIONS_CREATE_CHILD: (keyword: string, parentSectionId: number) => `/admin/pages/${keyword}/sections/${parentSectionId}/sections/create`,
        
        // Admin section management endpoints
        ADMIN_PAGES_ADD_SECTION: (keyword: string) => `/admin/pages/${keyword}/sections`,
        ADMIN_PAGES_REMOVE_SECTION: (keyword: string, sectionId: number) => `/admin/pages/${keyword}/sections/${sectionId}`,
        ADMIN_SECTIONS_ADD: (keyword: string, parentSectionId: number) => `/admin/pages/${keyword}/sections/${parentSectionId}/sections`,
        ADMIN_SECTIONS_REMOVE: (keyword: string, parentSectionId: number, childSectionId: number) => `/admin/pages/${keyword}/sections/${parentSectionId}/sections/${childSectionId}`,
        ADMIN_SECTIONS_UPDATE: (keyword: string, sectionId: number) => `/admin/pages/${keyword}/sections/${sectionId}`,
        ADMIN_SECTIONS_GET_ONE: (keyword: string, sectionId: number) => `/admin/pages/${keyword}/sections/${sectionId}`,
        ADMIN_SECTIONS_GET_CHILDREN: (keyword: string, parentSectionId: number) => `/admin/pages/${keyword}/sections/${parentSectionId}/sections`,
        
        // Admin section export/import endpoints
        ADMIN_SECTIONS_EXPORT_PAGE: (keyword: string) => `/admin/pages/${keyword}/sections/export`,
        ADMIN_SECTIONS_EXPORT_SECTION: (keyword: string, sectionId: number) => `/admin/pages/${keyword}/sections/${sectionId}/export`,
        ADMIN_SECTIONS_IMPORT_TO_PAGE: (keyword: string) => `/admin/pages/${keyword}/sections/import`,
        ADMIN_SECTIONS_IMPORT_TO_SECTION: (keyword: string, parentSectionId: number) => `/admin/pages/${keyword}/sections/${parentSectionId}/import`,
        
        // Legacy endpoints (keeping for backward compatibility)
        PAGES_GET_ONE_WITH_LANGUAGE: (keyword: string, languageId: number) => `/pages/${keyword}?language_id=${languageId}`,
        ADMIN_PAGES_GET_ONE_WITH_LANGUAGE: (keyword: string, languageId: number) => `/admin/pages/${keyword}?language_id=${languageId}`,
        ADMIN_LANGUAGES: '/admin/languages', // Alias for ADMIN_LANGUAGES_GET_ALL
        
        // Deprecated endpoints (marked for removal)
        ADMIN_SECTIONS_ADD_TO_PAGE: (keyword: string) => `/admin/pages/${keyword}/sections`, // Use ADMIN_PAGES_ADD_SECTION
        ADMIN_SECTIONS_ADD_TO_SECTION: (keyword: string, parentSectionId: number) => `/admin/pages/${keyword}/sections/${parentSectionId}/sections`, // Use ADMIN_SECTIONS_ADD
        ADMIN_SECTIONS_UPDATE_SECTION: (keyword: string, sectionId: number) => `/admin/pages/${keyword}/sections/${sectionId}`, // Use ADMIN_SECTIONS_UPDATE
        ADMIN_SECTIONS_REMOVE_FROM_SECTION: (keyword: string, parentSectionId: number, childSectionId: number) => `/admin/pages/${keyword}/sections/${parentSectionId}/sections/${childSectionId}`, // Use ADMIN_SECTIONS_REMOVE
        ADMIN_SECTIONS_DELETE: (keyword: string, sectionId: number) => `/admin/pages/${keyword}/sections/${sectionId}`, // Use ADMIN_PAGES_REMOVE_SECTION
        ADMIN_PAGES_SECTIONS_CREATE: (keyword: string) => `/admin/pages/${keyword}/sections/create`, // Use ADMIN_PAGES_CREATE_SECTION
        ADMIN_SECTIONS_CREATE_IN_SECTION: (keyword: string, parentSectionId: number) => `/admin/pages/${keyword}/sections/${parentSectionId}/sections/create`, // Use ADMIN_SECTIONS_CREATE_CHILD
        USER_LANGUAGE_PREFERENCE: '/auth/set-language', // Use AUTH_SET_LANGUAGE
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