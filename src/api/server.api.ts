/**
 * Server-side API utilities for fetching data in Server Components
 * These functions run on the server and don't use React Query
 */

import { headers } from 'next/headers';
import { API_CONFIG } from '../config/api.config';
import { ILanguage } from '../types/responses/admin/languages.types';
import { IUserDataResponse } from '../types/auth/jwt-payload.types';
import { IPageItem } from '../types/common/pages.type';
import { IAdminPage } from '../types/responses/admin/admin.types';

/**
 * Server-side API client for making requests from Server Components
 */
class ServerApiClient {
    private baseURL: string;

    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
    }

    /**
     * Get access token from middleware headers or cookies
     */
    private async getAuthHeaders(): Promise<Record<string, string>> {
        const headersList = await headers();
        const accessToken = headersList.get('x-access-token');
        
        const baseHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Client-Type': 'web',
        };
        
        if (accessToken) {
            baseHeaders['Authorization'] = `Bearer ${accessToken}`;
        }
        
        return baseHeaders;
    }

    /**
     * Make authenticated GET request from server
     */
    async get<T>(endpoint: string): Promise<T | null> {
        try {
            const authHeaders = await this.getAuthHeaders();
            
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'GET',
                headers: authHeaders,
                cache: 'no-store', // Always fetch fresh data on server
            });

            if (!response.ok) {

                return null;
            }

            const data = await response.json();
            return data.data || data; // Handle both wrapped and unwrapped responses
        } catch (error) {

            return null;
        }
    }

    /**
     * Check if user is authenticated by checking middleware headers
     */
    async isAuthenticated(): Promise<boolean> {
        const headersList = await headers();
        return headersList.get('x-auth') === '1';
    }

    /**
     * Check if current request is for admin route
     */
    async isAdminRequest(): Promise<boolean> {
        const headersList = await headers();
        return headersList.get('x-admin-check') === '1';
    }
}

const serverApi = new ServerApiClient();

/**
 * Server-side API functions for data fetching in Server Components
 */
export const ServerApi = {
    /**
     * Fetch user data on server side
     */
    async getUserData(): Promise<IUserDataResponse['data'] | null> {
        const isAuth = await serverApi.isAuthenticated();
        if (!isAuth) return null;
        
        const response = await serverApi.get<IUserDataResponse>(API_CONFIG.ENDPOINTS.AUTH_USER_DATA.route);
        return response?.data || null;
    },

    /**
     * Fetch public languages on server side
     */
    async getPublicLanguages(): Promise<ILanguage[] | null> {
        return await serverApi.get<ILanguage[]>(API_CONFIG.ENDPOINTS.LANGUAGES.route);
    },

    /**
     * Fetch frontend pages with language support
     */
    async getFrontendPages(languageId: number): Promise<IPageItem[] | null> {
        return await serverApi.get<IPageItem[]>(API_CONFIG.ENDPOINTS.PAGES_GET_ALL_WITH_LANGUAGE.route(languageId));
    },

    /**
     * Fetch admin pages (for authenticated admin users)
     */
    async getAdminPages(): Promise<IAdminPage[] | null> {
        const isAuth = await serverApi.isAuthenticated();
        const isAdmin = await serverApi.isAdminRequest();
        if (!isAuth || !isAdmin) return null;
        
        return await serverApi.get<IAdminPage[]>(API_CONFIG.ENDPOINTS.ADMIN_PAGES_GET_ALL.route);
    },

    /**
     * Fetch CSS classes for theming
     */
    async getCssClasses(): Promise<any[] | null> {
        const response = await serverApi.get<{ classes: any[] }>(API_CONFIG.ENDPOINTS.FRONTEND_CSS_CLASSES_GET_ALL.route);
        return response?.classes || null;
    },

    /**
     * Fetch CMS preferences (for admin users)
     */
    async getCmsPreferences(): Promise<any | null> {
        const isAuth = await serverApi.isAuthenticated();
        const isAdmin = await serverApi.isAdminRequest();
        if (!isAuth || !isAdmin) return null;
        
        return await serverApi.get<any>(API_CONFIG.ENDPOINTS.ADMIN_CMS_PREFERENCES_GET.route);
    },

    /**
     * Fetch admin page details on server side
     */
    async getAdminPageDetails(pageId: number): Promise<any | null> {
        const isAuth = await serverApi.isAuthenticated();
        const isAdmin = await serverApi.isAdminRequest();
        if (!isAuth || !isAdmin) return null;
        
        if (!pageId || pageId <= 0) {
            return null;
        }
        
        return await serverApi.get<any>(API_CONFIG.ENDPOINTS.ADMIN_PAGES_GET_ONE.route(pageId));
    },

    /**
     * Check authentication status from middleware
     */
    isAuthenticated: serverApi.isAuthenticated.bind(serverApi),
    
    /**
     * Check admin access from middleware  
     */
    isAdminRequest: serverApi.isAdminRequest.bind(serverApi),
};
