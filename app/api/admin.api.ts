/**
 * API client for handling admin-related API calls.
 * Provides methods for fetching and managing admin resources.
 * 
 * @module api/admin.api
 */

import { IApiResponse, IAdminPage } from '@/types/api/requests.type';
import { apiClient } from './base.api';
import { API_CONFIG } from '@/config/api.config';

export const AdminApi = {
    /**
     * Fetches all admin pages.
     * @returns {Promise<IAdminPage[]>} Array of admin pages
     * @throws {Error} When API request fails
     */
    async getAdminPages(): Promise<IAdminPage[]> {
        const response = await apiClient.get<IApiResponse<IAdminPage[]>>(API_CONFIG.ENDPOINTS.ADMIN_PAGES);
        return response.data.data;
    }
};