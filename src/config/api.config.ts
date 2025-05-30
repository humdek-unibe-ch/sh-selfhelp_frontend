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
        PAGES: '/pages',
        GET_PAGE: (keyword: string) => `/pages/${keyword}`,
        LOGIN: '/auth/login',
        REFRESH_TOKEN: '/auth/refresh-token',
        LOGOUT: '/auth/logout',
        TWO_FACTOR_VERIFY: '/auth/two-factor-verify',
        ADMIN_PAGES: '/admin/pages',
        ADMIN_ACCESS: '/admin/access',
        ADMIN_PAGE_FIELDS: (keyword: string) => `/admin/pages/${keyword}/fields`,
        ADMIN_PAGE_SECTIONS: (keyword: string) => `/admin/pages/${keyword}/sections`,
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