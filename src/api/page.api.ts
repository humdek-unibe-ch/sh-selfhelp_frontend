/**
 * API client for handling page content-related API calls.
 * Provides methods for fetching and updating page content.
 * 
 * @module api/page.api
 */

import { ILanguage } from '../types/responses/admin/languages.types';
import { apiClient } from './base.api';
import { API_CONFIG } from '../config/api.config';
import { IBaseApiResponse } from '../types/responses/common/response-envelope.types';
import { IPageContent } from '../types/common/pages.type';

export const PageApi = {
    /**
     * Fetches page content for a specific page ID.
     * @param {number} pageId - The page identifier
     * @param {number} [languageId] - The language ID for localized content
     * @returns {Promise<IPageContent>} Page content data
     * @throws {Error} When API request fails
     */
    // TODO: execued twice and more when executed in the beegigng, maybe add loading state
    async getPageContent(pageId: number, languageId?: number): Promise<IPageContent> {
        let url = API_CONFIG.ENDPOINTS.PAGES_GET_ONE(pageId);
        
        // Add language parameter if provided
        if (languageId) {
            url += `?language_id=${languageId}`;
        }

        console.log('url', url);
        
        const response = await apiClient.get<IBaseApiResponse<{ page: IPageContent }>>(url);
        return response.data.data.page;
    },
    
    /**
     * Fetches available languages for public use (non-authenticated users).
     * @returns {Promise<ILanguage[]>} Array of available languages
     * @throws {Error} When API request fails
     */
    async getPublicLanguages(): Promise<ILanguage[]> {
        const response = await apiClient.get<IBaseApiResponse<ILanguage[]>>(API_CONFIG.ENDPOINTS.LANGUAGES);
        return response.data.data;
    },

    /**
     * Updates page content for a specific page ID.
     * @param {number} pageId - The page identifier
     * @param {any} content - The new content to update
     * @returns {Promise<IBaseApiResponse<any>>} API response with updated data
     * @throws {Error} When update fails
     */
    async updatePageContent(pageId: number, content: any): Promise<IBaseApiResponse<any>> {
        try {
            const response = await apiClient.put<IBaseApiResponse<any>>(API_CONFIG.ENDPOINTS.PAGES_GET_ONE(pageId), content);
            return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                return error.response.data;
            }
            throw error;
        }
    }
};
