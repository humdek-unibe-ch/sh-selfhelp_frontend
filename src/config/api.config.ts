export const API_CONFIG = {
    BASE_URL: '/api/v1',
    ENDPOINTS: {
        NAVIGATION: '/nav/pages/web',
        PAGE_CONTENT: (keyword: string) => `/webPage/page/${keyword}`
    }
};