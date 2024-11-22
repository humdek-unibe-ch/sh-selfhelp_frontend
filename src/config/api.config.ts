export const API_CONFIG = {
    BASE_URL: '/api/v1',
    ENDPOINTS: {
        ALL_ROUTES: '/content/all_routes',
        PAGE_CONTENT: (keyword: string) => `/content/page/${keyword}`,
        LOGIN: '/auth/login'
    }
};