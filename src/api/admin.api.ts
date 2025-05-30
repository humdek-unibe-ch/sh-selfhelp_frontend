/**
 * API client for handling admin-related API calls.
 * Provides methods for fetching and managing admin resources.
 * 
 * @module api/admin.api
 */

import { IApiResponse, IAdminPage, IAdminAccess } from '../types/requests/requests.type';
import { IPageFieldsResponse, IPageField } from '../types/common/pages.type';
import { apiClient } from './base.api';
import { API_CONFIG } from '../config/api.config';

export const AdminApi = {
    /**
     * Fetches all admin pages.
     * @returns {Promise<IAdminPage[]>} Array of admin pages
     * @throws {Error} When API request fails
     */
    async getAdminPages(): Promise<IAdminPage[]> {
        const response = await apiClient.get<IApiResponse<IAdminPage[]>>(API_CONFIG.ENDPOINTS.ADMIN_PAGES);
        return response.data.data;
    },

    async getAdminAccess(): Promise<IAdminAccess> {
        const response = await apiClient.get<IApiResponse<IAdminAccess>>(API_CONFIG.ENDPOINTS.ADMIN_ACCESS);
        return response.data.data;
    },

    /**
     * Fetches page fields for a specific page by keyword.
     * @param {string} keyword - The page keyword to fetch fields for
     * @returns {Promise<IPageFieldsResponse>} Page fields response
     * @throws {Error} When API request fails
     */
    async getPageFields(keyword: string): Promise<IPageField[]> {
        const response = await apiClient.get<IPageFieldsResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGE_FIELDS(keyword)
        );
        return response.data.data;
    },

    /**
     * Fetches page sections for a specific page by keyword.
     * @param {string} keyword - The page keyword to fetch sections for
     * @returns {Promise<IPageField[]>} Array of page sections with nested structure
     * @throws {Error} When API request fails
     */
    async getPageSections(keyword: string): Promise<IPageField[]> {
        const response = await apiClient.get<IPageFieldsResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGE_SECTIONS(keyword)
        );
        return response.data.data;
    }
};