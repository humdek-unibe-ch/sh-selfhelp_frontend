/**
 * Admin Page API client for handling page-related admin operations.
 * Provides methods for managing pages in the admin interface.
 * 
 * @module api/admin/page.api
 */

import { apiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import { IAdminPage } from '../../types/responses/admin/admin.types';
import { ICreatePageRequest } from '../../types/requests/admin/create-page.types';
import { IUpdatePageRequest } from '../../types/requests/admin/update-page.types';
import { IPageFieldsResponse, IPageFieldsData, TPageFieldsResponse, IPageSectionWithFields } from '../../types/common/pages.type';

export const AdminPageApi = {
    /**
     * Fetches all admin pages.
     * @returns {Promise<IAdminPage[]>} Array of admin pages
     * @throws {Error} When API request fails
     */
    async getAdminPages(): Promise<IAdminPage[]> {
        const response = await apiClient.get<IBaseApiResponse<IAdminPage[]>>(API_CONFIG.ENDPOINTS.ADMIN_PAGES_GET_ALL);

        return response.data.data;
    },

    /**
     * Fetches page fields for a specific page by ID.
     * @param {number} pageId - The page ID to fetch fields for
     * @returns {Promise<IPageFieldsData>} Page fields response with page details
     * @throws {Error} When API request fails
     */
    async getPageFields(pageId: number): Promise<IPageFieldsData> {
        const response = await apiClient.get<TPageFieldsResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_GET_ONE(pageId)
        );
        return response.data.data;
    },

    /**
     * Fetches page sections for a specific page by ID.
     * @param {number} pageId - The page ID to fetch sections for
     * @returns {Promise<IPageSectionWithFields[]>} Array of page sections with nested structure
     * @throws {Error} When API request fails
     */
    async getPageSections(pageId: number): Promise<IPageSectionWithFields[]> {
        const response = await apiClient.get<IPageFieldsResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_SECTIONS_GET(pageId)
        );
        return response.data.data.sections as IPageSectionWithFields[];
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
     * @param {number} pageId - The page ID to update
     * @param {IUpdatePageRequest} updateData - The page data and fields to update
     * @returns {Promise<IAdminPage>} The updated page data
     * @throws {Error} When API request fails
     */
    async updatePage(pageId: number, updateData: IUpdatePageRequest): Promise<IAdminPage> {
        const response = await apiClient.put<IBaseApiResponse<IAdminPage>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_UPDATE(pageId),
            updateData
        );
        return response.data.data;
    },

    /**
     * Deletes a page by ID
     * @param {number} pageId - The page ID to delete
     * @returns {Promise<{ success: boolean }>} Success response
     * @throws {Error} When API request fails
     */
    async deletePage(pageId: number): Promise<{ success: boolean }> {
        const response = await apiClient.delete(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_DELETE(pageId)
        );
        // For 204 No Content responses, return success indicator
        return { success: response.status === 204 || response.status === 200 };
    }
}; 