/**
 * API client for handling page content-related API calls.
 * Provides methods for fetching and updating page content.
 * 
 * @module api/page.api
 */

import { IPageContent } from '../types/responses/frontend/frontend.types';
import { ILanguage } from '../types/responses/admin/languages.types';
import { apiClient } from './base.api';
import { API_CONFIG } from '../config/api.config';
import { IBaseApiResponse } from '../types/responses/common/response-envelope.types';

export const PageApi = {
    /**
     * Fetches page content for a specific keyword.
     * @param {string} keyword - The page identifier
     * @param {string} [language] - The language code for localized content
     * @returns {Promise<IPageContent>} Page content data
     * @throws {Error} When API request fails
     */
    async getPageContent(keyword: string, language?: string): Promise<IPageContent> {
        let url = API_CONFIG.ENDPOINTS.PAGES_GET_ONE(keyword);
        
        // Add language parameter if provided
        if (language) {
            url += `?language=${encodeURIComponent(language)}`;
        }
        
        const response = await apiClient.get<IBaseApiResponse<IPageContent>>(url);
        return response.data.data;
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
     * Updates page content for a specific keyword.
     * @param {string} keyword - The page identifier
     * @param {any} content - The new content to update
     * @returns {Promise<IBaseApiResponse<any>>} API response with updated data
     * @throws {Error} When update fails
     */
    async updatePageContent(keyword: string, content: any): Promise<IBaseApiResponse<any>> {
        try {
            const response = await apiClient.put<IBaseApiResponse<any>>(API_CONFIG.ENDPOINTS.PAGES_GET_ONE(keyword), content);
            return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                return error.response.data;
            }
            throw error;
        }
    }
};
