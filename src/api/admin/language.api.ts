/**
 * Admin Language API client for handling language-related admin operations.
 * Provides methods for managing languages in the admin interface.
 *
 * @module api/admin/language.api
 */

import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import { TLanguagesResponse, TLanguageResponse, ILanguage } from '../../types/responses/admin/languages.types';
import { ICreateLanguageRequest, IUpdateLanguageRequest } from '../../types/requests/admin/languages.types';

export const AdminLanguageApi = {
    /**
     * Fetches all available languages.
     * @returns {Promise<ILanguage[]>} Array of available languages
     * @throws {Error} When API request fails
     */
    async getLanguages(): Promise<ILanguage[]> {        
        const response = await permissionAwareApiClient.get<TLanguagesResponse>(API_CONFIG.ENDPOINTS.ADMIN_LANGUAGES_GET_ALL);
        return response.data.data;
    },

    /**
     * Fetches a single language by ID.
     * @param {number} languageId - The ID of the language to fetch
     * @returns {Promise<ILanguage>} Language details
     * @throws {Error} When API request fails
     */
    async getLanguageById(languageId: number): Promise<ILanguage> {
        const response = await permissionAwareApiClient.get<TLanguageResponse>(API_CONFIG.ENDPOINTS.ADMIN_LANGUAGES_GET_ONE, languageId);
        return response.data.data;
    },

    /**
     * Creates a new language.
     * @param {ICreateLanguageRequest} languageData - Language data to create
     * @returns {Promise<ILanguage>} Created language
     * @throws {Error} When API request fails
     */
    async createLanguage(languageData: ICreateLanguageRequest): Promise<ILanguage> {
        const response = await permissionAwareApiClient.post<TLanguageResponse>(API_CONFIG.ENDPOINTS.ADMIN_LANGUAGES_CREATE, languageData);
        return response.data.data;
    },

    /**
     * Updates an existing language.
     * @param {number} languageId - The ID of the language to update
     * @param {IUpdateLanguageRequest} languageData - Updated language data
     * @returns {Promise<ILanguage>} Updated language
     * @throws {Error} When API request fails
     */
    async updateLanguage(languageId: number, languageData: IUpdateLanguageRequest): Promise<ILanguage> {
        const response = await permissionAwareApiClient.put<TLanguageResponse>(API_CONFIG.ENDPOINTS.ADMIN_LANGUAGES_UPDATE, languageData, languageId);
        return response.data.data;
    },

    /**
     * Deletes a language.
     * @param {number} languageId - The ID of the language to delete
     * @returns {Promise<{ success: boolean }>} Success status
     * @throws {Error} When API request fails
     */
    async deleteLanguage(languageId: number): Promise<{ success: boolean }> {
        const response = await permissionAwareApiClient.delete(API_CONFIG.ENDPOINTS.ADMIN_LANGUAGES_DELETE, languageId);
        return { success: response.status === 204 || response.status === 200 };
    }
}; 