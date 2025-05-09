/**
 * API Configuration
 * Backend is running at http://localhost/selfhelp
 * Frontend is running at http://localhost:3000/Teilnahme
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://84.75.194.2/selfhelp';

export const API_CONFIG = {
    BASE_URL: `${API_BASE_URL}/cms-api/v1`,
    ENDPOINTS: {
        ALL_ROUTES: '/content/all_routes',
        PAGE: (keyword: string) => `/content/page/${keyword}`,
        LOGIN: '/auth/login',
        REFRESH_TOKEN: '/auth/refresh_token',
        LOGOUT: '/auth/logout',
        TWO_FACTOR_SETUP: '/auth/two-factor-setup',
        TWO_FACTOR_VERIFY: '/auth/two-factor-verify',
        ADMIN_PAGES: '/admin/pages',
        ADMIN_ACCESS: '/admin/access',
    },
    CORS_CONFIG: {
        credentials: true, // Required for cookies, authorization headers with HTTPS
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    }
};