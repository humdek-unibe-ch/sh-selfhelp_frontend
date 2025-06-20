/**
 * API Configuration
 * Backend is running at http://localhost/selfhelp
 * Frontend is running at http://localhost:3000/Teilnahme
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_CONFIG = {
    BASE_URL: `${API_BASE_URL}/cms-api/v1`,
    ENDPOINTS: {
        /**
         * Fetches a list of pages when not logged in.
         * WARNING: When logged in, the backend returns a specific page's content (e.g., 'task' page sections),
         * NOT a list of pages. Use ALL_ROUTES for a consistent list of navigation routes.
         */
        PAGES_GET_ALL: '/pages',
        PAGES_GET_ONE: (keyword: string) => `/pages/${keyword}`,
        AUTH_LOGIN: '/auth/login',
        AUTH_REFRESH_TOKEN: '/auth/refresh-token',
        AUTH_LOGOUT: '/auth/logout',
        TWO_FACTOR_VERIFY: '/auth/two-factor-verify',
        ADMIN_PAGES_GET_ALL: '/admin/pages',
        ADMIN_PAGES_SECTIONS_GET: (keyword: string) => `/admin/pages/${keyword}/sections`,
        ADMIN_PAGES_GET_ONE: (keyword: string) => `/admin/pages/${keyword}`,
        ADMIN_PAGES_DELETE: (keyword: string) => `/admin/pages/${keyword}`,
        ADMIN_PAGES_UPDATE: (keyword: string) => `/admin/pages/${keyword}`,
        ADMIN_PAGES_CREATE: '/admin/pages',
        ADMIN_LANGUAGES: '/admin/languages',
        ADMIN_LOOKUPS: '/admin/lookups',
        // Section management endpoints
        ADMIN_PAGES_SECTIONS_ADD: (keyword: string) => `/admin/pages/${keyword}/sections`,
        ADMIN_PAGES_SECTIONS_UPDATE: (keyword: string, sectionId: number) => `/admin/pages/${keyword}/sections/${sectionId}`,
        ADMIN_PAGES_SECTIONS_REMOVE: (keyword: string, sectionId: number) => `/admin/pages/${keyword}/sections/${sectionId}`,
        ADMIN_SECTIONS_ADD_TO_SECTION: (keyword: string, parentSectionId: number) => `/admin/pages/${keyword}/sections/${parentSectionId}/sections`,
        ADMIN_SECTIONS_UPDATE_SECTION: (keyword: string, sectionId: number) => `/admin/pages/${keyword}/sections/${sectionId}`,
        ADMIN_SECTIONS_REMOVE_FROM_SECTION: (keyword: string, parentSectionId: number, childSectionId: number) => `/admin/pages/${keyword}/sections/${parentSectionId}/sections/${childSectionId}`,
        ADMIN_SECTIONS_DELETE: (keyword: string, sectionId: number) => `/admin/pages/${keyword}/sections/${sectionId}`,
        ADMIN_SECTIONS_GET_ONE: (keyword: string, sectionId: number) => `/admin/pages/${keyword}/sections/${sectionId}`,
        // Styles endpoints
        ADMIN_STYLES_GET_ALL: '/admin/styles',
        // Section creation endpoints
        ADMIN_PAGES_SECTIONS_CREATE: (keyword: string) => `/admin/pages/${keyword}/sections/create`,
        ADMIN_SECTIONS_CREATE_IN_SECTION: (keyword: string, parentSectionId: number) => `/admin/pages/${keyword}/sections/${parentSectionId}/sections/create`,
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