/**
 * Admin Language API client for handling language-related admin operations.
 * Provides methods for managing languages in the admin interface.
 * 
 * @module api/admin/language.api
 */

import { apiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import { TLanguagesResponse, ILanguage } from '../../types/responses/admin/languages.types';

export const AdminLanguageApi = {
    /**
     * Fetches all available languages.
     * @returns {Promise<ILanguage[]>} Array of available languages
     * @throws {Error} When API request fails
     */
    async getLanguages(): Promise<ILanguage[]> {
        const response = await apiClient.get<TLanguagesResponse>(API_CONFIG.ENDPOINTS.ADMIN_LANGUAGES);
        return response.data.data;
    }
}; 