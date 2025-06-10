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
        ADMIN_PAGES_CREATE: '/admin/pages',
        ADMIN_LANGUAGES: '/admin/languages',
        ADMIN_LOOKUPS: '/admin/lookups',        
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