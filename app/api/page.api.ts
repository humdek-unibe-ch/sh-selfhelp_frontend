/**
 * API client for handling page content-related API calls.
 * Provides methods for fetching and updating page content.
 * 
 * @module api/page.api
 */

import { IApiResponse, IPageContent } from '@/types/api/requests.type';
import { apiClient } from './base.api';
import { API_CONFIG } from '@/config/api.config';

export const PageApi = {
    /**
     * Fetches page content for a specific keyword.
     * @param {string} keyword - The page identifier
     * @returns {Promise<IPageContent>} Page content data
     * @throws {Error} When API request fails
     */
    async getPageContent(keyword: string): Promise<IPageContent> {
        const response = await apiClient.get<IApiResponse<IPageContent>>(API_CONFIG.ENDPOINTS.PAGE(keyword));
        return response.data.data;
    },

    /**
     * Updates page content for a specific keyword.
     * @param {string} keyword - The page identifier
     * @param {any} content - The new content to update
     * @returns {Promise<IApiResponse<any>>} API response with updated data
     * @throws {Error} When update fails
     */
    async updatePageContent(keyword: string, content: any): Promise<IApiResponse<any>> {
        try {
            const response = await apiClient.put<IApiResponse<any>>(API_CONFIG.ENDPOINTS.PAGE(keyword), content);
            return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                return error.response.data;
            }
            throw error;
        }
    }
};
