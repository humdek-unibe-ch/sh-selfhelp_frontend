export const API_CONFIG = {
    BASE_URL: '/api/v1',
    ENDPOINTS: {
        ALL_ROUTES: '/content/all_routes',
        PAGE: (keyword: string) => `/content/page/${keyword}`,
        LOGIN: '/auth/login',
        REFRESH_TOKEN: '/auth/refresh_token',
        LOGOUT: '/auth/logout',
    }
};