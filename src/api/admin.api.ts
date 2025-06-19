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
import { IAdminPage, TSectionDetailsResponse, ISectionDetailsData } from '../types/responses/admin/admin.types';
import { ICreatePageRequest } from '../types/requests/admin/create-page.types';
import { IUpdatePageRequest } from '../types/requests/admin/update-page.types';
import { TPageFieldsResponse, IPageFieldsData } from '../types/responses/admin/page-details.types';
import { TLanguagesResponse, ILanguage } from '../types/responses/admin/languages.types';
import { TStyleGroupsResponse, IStyleGroup } from '../types/responses/admin/styles.types';
import { 
    ICreateSectionRequest,
    IAddSectionToPageData,
    IAddSectionToSectionData,
    ICreateSectionInPageData,
    ICreateSectionInSectionData,
    IUpdateSectionInPageData,
    IUpdateSectionInSectionData
} from '../types/requests/admin/create-section.types';

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
        return response.data.data.sections;
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
     * @returns {Promise<{ success: boolean }>} Success response
     * @throws {Error} When API request fails
     */
    async deletePage(keyword: string): Promise<{ success: boolean }> {
        const response = await apiClient.delete(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_DELETE(keyword)
        );
        // For 204 No Content responses, return success indicator
        return { success: response.status === 204 || response.status === 200 };
    },

    // Section Management API Methods

    /**
     * Adds an existing section to a page
     * @param {string} keyword - The page keyword
     * @param {number} sectionId - The section ID to add
     * @param {IAddSectionToPageData} sectionData - The section data to add (position)
     * @returns {Promise<any>} The created section data
     * @throws {Error} When API request fails
     */
    async addSectionToPage(keyword: string, sectionId: number, sectionData: IAddSectionToPageData): Promise<any> {
        const requestBody = {
            sectionId: sectionId,
            position: sectionData.position,
            ...(sectionData.oldParentPageId && { oldParentPageId: sectionData.oldParentPageId }),
            ...(sectionData.oldParentSectionId && { oldParentSectionId: sectionData.oldParentSectionId })
        };
        
        const response = await apiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_SECTIONS_ADD(keyword),
            requestBody
        );
        return response.data.data;
    },

    /**
     * Updates a section in a page
     * @param {string} keyword - The page keyword
     * @param {number} sectionId - The section ID to update
     * @param {IUpdateSectionInPageData} sectionData - The section data to update (position)
     * @returns {Promise<any>} The updated section data
     * @throws {Error} When API request fails
     */
    async updateSectionInPage(keyword: string, sectionId: number, sectionData: IUpdateSectionInPageData): Promise<any> {
        const response = await apiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_SECTIONS_UPDATE(keyword, sectionId),
            sectionData
        );
        return response.data.data;
    },

    /**
     * Removes a section from a page
     * @param {string} keyword - The page keyword
     * @param {number} sectionId - The section ID to remove
     * @returns {Promise<{ success: boolean }>} Success response
     * @throws {Error} When API request fails
     */
    async removeSectionFromPage(keyword: string, sectionId: number): Promise<{ success: boolean }> {
        const response = await apiClient.delete(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_SECTIONS_REMOVE(keyword, sectionId)
        );
        // For 204 No Content responses, return success indicator
        return { success: response.status === 204 || response.status === 200 };
    },

    /**
     * Adds an existing section to another section
     * @param {string} keyword - The page keyword
     * @param {number} parentSectionId - The parent section ID
     * @param {number} sectionId - The section ID to add
     * @param {IAddSectionToSectionData} sectionData - The section data to add (position)
     * @returns {Promise<any>} The created section data
     * @throws {Error} When API request fails
     */
    async addSectionToSection(keyword: string, parentSectionId: number, sectionId: number, sectionData: IAddSectionToSectionData): Promise<any> {
        const requestBody = {
            childSectionId: sectionId,
            position: sectionData.position,
            ...(sectionData.oldParentPageId && { oldParentPageId: sectionData.oldParentPageId }),
            ...(sectionData.oldParentSectionId && { oldParentSectionId: sectionData.oldParentSectionId })
        };
        
        const response = await apiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_ADD_TO_SECTION(keyword, parentSectionId),
            requestBody
        );
        return response.data.data;
    },

    /**
     * Updates a section within another section
     * @param {string} keyword - The page keyword
     * @param {number} parentSectionId - The parent section ID
     * @param {number} childSectionId - The child section ID to update
     * @param {IUpdateSectionInSectionData} sectionData - The section data to update (position)
     * @returns {Promise<any>} The updated section data
     * @throws {Error} When API request fails
     */
    async updateSectionInSection(keyword: string, parentSectionId: number, childSectionId: number, sectionData: IUpdateSectionInSectionData): Promise<any> {
        const response = await apiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_UPDATE_IN_SECTION(keyword, parentSectionId, childSectionId),
            sectionData
        );
        return response.data.data;
    },

    /**
     * Removes a section from another section
     * @param {string} keyword - The page keyword
     * @param {number} parentSectionId - The parent section ID
     * @param {number} childSectionId - The child section ID to remove
     * @returns {Promise<{ success: boolean }>} Success response
     * @throws {Error} When API request fails
     */
    async removeSectionFromSection(keyword: string, parentSectionId: number, childSectionId: number): Promise<{ success: boolean }> {
        const response = await apiClient.delete(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_REMOVE_FROM_SECTION(keyword, parentSectionId, childSectionId)
        );
        // For 204 No Content responses, return success indicator
        return { success: response.status === 204 || response.status === 200 };
    },

    // Style Management API Methods

    /**
     * Fetches all style groups.
     * @returns {Promise<IStyleGroup[]>} Array of style groups
     * @throws {Error} When API request fails
     */
    async getStyleGroups(): Promise<IStyleGroup[]> {
        const response = await apiClient.get<TStyleGroupsResponse>(API_CONFIG.ENDPOINTS.ADMIN_STYLES_GET_ALL);
        return response.data.data;
    },

    /**
     * Creates a new section in a page from a style
     * @param {string} keyword - The page keyword
     * @param {ICreateSectionInPageData} sectionData - The section data to create (styleId, position)
     * @returns {Promise<any>} The created section data
     * @throws {Error} When API request fails
     */
    async createSectionInPage(keyword: string, sectionData: ICreateSectionInPageData): Promise<any> {
        const response = await apiClient.post<IBaseApiResponse<any>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_SECTIONS_CREATE(keyword),
            sectionData
        );
        return response.data.data;
    },

    /**
     * Creates a new section in another section from a style
     * @param {string} keyword - The page keyword
     * @param {number} parentSectionId - The parent section ID
     * @param {ICreateSectionInSectionData} sectionData - The section data to create (styleId, position)
     * @returns {Promise<any>} The created section data
     * @throws {Error} When API request fails
     */
    async createSectionInSection(keyword: string, parentSectionId: number, sectionData: ICreateSectionInSectionData): Promise<any> {
        const response = await apiClient.post<IBaseApiResponse<any>>(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_CREATE_IN_SECTION(keyword, parentSectionId),
            sectionData
        );
        return response.data.data;
    },

    /**
     * Fetches section details for a specific section by ID.
     * @param {string} keyword - The page keyword
     * @param {number} sectionId - The section ID to fetch details for
     * @returns {Promise<ISectionDetailsData>} Section details response with section info and fields
     * @throws {Error} When API request fails
     */
    async getSectionDetails(keyword: string, sectionId: number): Promise<ISectionDetailsData> {
        const response = await apiClient.get<TSectionDetailsResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_GET_ONE(keyword, sectionId)
        );
        return response.data.data;
    }
};