/**
 * API client for handling admin-related API calls.
 * Provides methods for fetching and managing admin resources.
 * 
 * @module api/admin.api
 */

import { IPageFieldsResponse, IPageField } from '../types/common/pages.type';
import { apiClient } from './base.api';
import { API_CONFIG } from '../config/api.config';
import { IBaseApiResponse } from '../types/responses/common/response-envelope.types';
import { IAdminPage } from '../types/responses/admin/admin.types';
import { ICreatePageRequest } from '../types/requests/admin/create-page.types';
import { IUpdatePageRequest } from '../types/requests/admin/update-page.types';
import { TPageFieldsResponse, IPageFieldsData } from '../types/responses/admin/page-details.types';
import { TLanguagesResponse, ILanguage } from '../types/responses/admin/languages.types';

export const AdminApi = {
    /**
     * Fetches all admin pages.
     * @returns {Promise<IAdminPage[]>} Array of admin pages
     * @throws {Error} When API request fails
     */
    async getAdminPages(): Promise<IAdminPage[]> {
        const response = await apiClient.get<IBaseApiResponse<IAdminPage[]>>(API_CONFIG.ENDPOINTS.ADMIN_PAGES_GET_ALL);
        console.log(response.data.data);
        return response.data.data;
    },

    /**
     * Fetches all available languages.
     * @returns {Promise<ILanguage[]>} Array of available languages
     * @throws {Error} When API request fails
     */
    async getLanguages(): Promise<ILanguage[]> {
        const response = await apiClient.get<TLanguagesResponse>(API_CONFIG.ENDPOINTS.ADMIN_LANGUAGES);
        return response.data.data;
    },

    /**
     * Fetches page fields for a specific page by keyword.
     * @param {string} keyword - The page keyword to fetch fields for
     * @returns {Promise<IPageFieldsData>} Page fields response with page details
     * @throws {Error} When API request fails
     */
    async getPageFields(keyword: string): Promise<IPageFieldsData> {
        const response = await apiClient.get<TPageFieldsResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_GET_ONE(keyword)
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
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_SECTIONS_GET(keyword)
        );
        return response.data.data;
    },

    /**
     * Creates a new page
     * @param {ICreatePageRequest} pageData - The page data to create
     * @returns {Promise<IAdminPage>} The created page data
     * @throws {Error} When API request fails
     */
    async createPage(pageData: ICreatePageRequest): Promise<IAdminPage> {
        const response = await apiClient.post<IBaseApiResponse<IAdminPage>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_CREATE,
            pageData
        );
        return response.data.data;
    },

    /**
     * Updates an existing page
     * @param {string} keyword - The page keyword to update
     * @param {IUpdatePageRequest} updateData - The page data and fields to update
     * @returns {Promise<IAdminPage>} The updated page data
     * @throws {Error} When API request fails
     */
    async updatePage(keyword: string, updateData: IUpdatePageRequest): Promise<IAdminPage> {
        const response = await apiClient.put<IBaseApiResponse<IAdminPage>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_UPDATE(keyword),
            updateData
        );
        return response.data.data;
    },

    /**
     * Deletes a page by keyword
     * @param {string} keyword - The page keyword to delete
     * @returns {Promise<void>} Success response
     * @throws {Error} When API request fails
     */
    async deletePage(keyword: string): Promise<void> {
        await apiClient.delete(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_DELETE(keyword)
        );
    }
};