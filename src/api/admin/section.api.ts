/**
 * Admin Section API client for handling section-related admin operations.
 * Provides methods for managing sections in the admin interface.
 * 
 * @module api/admin/section.api
 */

import { apiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import { TSectionDetailsResponse, ISectionDetailsData } from '../../types/responses/admin/admin.types';
import { 
    IAddSectionToPageData,
    IAddSectionToSectionData,
    ICreateSectionInPageData,
    ICreateSectionInSectionData,
    IUpdateSectionInPageData,
    IUpdateSectionInSectionData
} from '../../types/requests/admin/create-section.types';

export const AdminSectionApi = {
    /**
     * Adds an existing section to a page
     * @param {number} pageId - The page ID
     * @param {number} sectionId - The section ID to add
     * @param {IAddSectionToPageData} sectionData - The section data to add (position)
     * @returns {Promise<any>} The created section data
     * @throws {Error} When API request fails
     */
    async addSectionToPage(pageId: number, sectionId: number, sectionData: IAddSectionToPageData): Promise<any> {
        const requestBody = {
            sectionId: sectionId,
            position: sectionData.position,
            ...(sectionData.oldParentPageId && { oldParentPageId: sectionData.oldParentPageId }),
            ...(sectionData.oldParentSectionId && { oldParentSectionId: sectionData.oldParentSectionId })
        };
        
        const response = await apiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_ADD_SECTION(pageId),
            requestBody
        );
        return response.data.data;
    },

    /**
     * Updates a section in a page
     * @param {number} pageId - The page ID
     * @param {number} sectionId - The section ID to update
     * @param {IUpdateSectionInPageData} sectionData - The section data to update (position)
     * @returns {Promise<any>} The updated section data
     * @throws {Error} When API request fails
     */
    async updateSectionInPage(pageId: number, sectionId: number, sectionData: IUpdateSectionInPageData): Promise<any> {
        const response = await apiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_UPDATE(pageId, sectionId),
            sectionData
        );
        return response.data.data;
    },

    /**
     * Updates a section (generic update for section content/properties)
     * @param {number} pageId - The page ID
     * @param {number} sectionId - The section ID to update
     * @param {any} sectionData - The section data to update
     * @returns {Promise<any>} The updated section data
     * @throws {Error} When API request fails
     */
    async updateSection(pageId: number, sectionId: number, sectionData: any): Promise<any> {
        const response = await apiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_UPDATE(pageId, sectionId),
            sectionData
        );
        return response.data.data;
    },

    /**
     * Removes a section from a page
     * @param {number} pageId - The page ID
     * @param {number} sectionId - The section ID to remove
     * @returns {Promise<{ success: boolean }>} Success response
     * @throws {Error} When API request fails
     */
    async removeSectionFromPage(pageId: number, sectionId: number): Promise<{ success: boolean }> {
        const response = await apiClient.delete(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_REMOVE_SECTION(pageId, sectionId)
        );
        // For 204 No Content responses, return success indicator
        return { success: response.status === 204 || response.status === 200 };
    },

    /**
     * Adds an existing section to another section
     * @param {number} pageId - The page ID
     * @param {number} parentSectionId - The parent section ID
     * @param {number} sectionId - The section ID to add
     * @param {IAddSectionToSectionData} sectionData - The section data to add (position)
     * @returns {Promise<any>} The created section data
     * @throws {Error} When API request fails
     */
    async addSectionToSection(pageId: number, parentSectionId: number, sectionId: number, sectionData: IAddSectionToSectionData): Promise<any> {
        const requestBody = {
            childSectionId: sectionId,
            position: sectionData.position,
            ...(sectionData.oldParentPageId && { oldParentPageId: sectionData.oldParentPageId }),
            ...(sectionData.oldParentSectionId && { oldParentSectionId: sectionData.oldParentSectionId })
        };
        
        const response = await apiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_ADD(pageId, parentSectionId),
            requestBody
        );
        return response.data.data;
    },

    /**
     * Removes a section from another section
     * @param {number} pageId - The page ID
     * @param {number} parentSectionId - The parent section ID
     * @param {number} childSectionId - The child section ID to remove
     * @returns {Promise<{ success: boolean }>} Success response
     * @throws {Error} When API request fails
     */
    async removeSectionFromSection(pageId: number, parentSectionId: number, childSectionId: number): Promise<{ success: boolean }> {
        const response = await apiClient.delete(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_REMOVE(pageId, parentSectionId, childSectionId)
        );
        // For 204 No Content responses, return success indicator
        return { success: response.status === 204 || response.status === 200 };
    },

    /**
     * Creates a new section in a page from a style
     * @param {number} pageId - The page ID
     * @param {ICreateSectionInPageData} sectionData - The section data to create (styleId, position)
     * @returns {Promise<any>} The created section data
     * @throws {Error} When API request fails
     */
    async createSectionInPage(pageId: number, sectionData: ICreateSectionInPageData): Promise<any> {
        const response = await apiClient.post<IBaseApiResponse<any>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_CREATE_SECTION(pageId),
            sectionData
        );
        return response.data.data;
    },

    /**
     * Creates a new section in another section from a style
     * @param {number} pageId - The page ID
     * @param {number} parentSectionId - The parent section ID
     * @param {ICreateSectionInSectionData} sectionData - The section data to create (styleId, position)
     * @returns {Promise<any>} The created section data
     * @throws {Error} When API request fails
     */
    async createSectionInSection(pageId: number, parentSectionId: number, sectionData: ICreateSectionInSectionData): Promise<any> {
        const response = await apiClient.post<IBaseApiResponse<any>>(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_CREATE_CHILD(pageId, parentSectionId),
            sectionData
        );
        return response.data.data;
    },

    /**
     * Fetches section details for a specific section by ID.
     * @param {number} pageId - The page ID
     * @param {number} sectionId - The section ID to fetch details for
     * @returns {Promise<ISectionDetailsData>} Section details response with section info and fields
     * @throws {Error} When API request fails
     */
    async getSectionDetails(pageId: number, sectionId: number): Promise<ISectionDetailsData> {
        const response = await apiClient.get<TSectionDetailsResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_GET_ONE(pageId, sectionId)
        );
        return response.data.data;
    },

    /**
     * Deletes a section by ID (permanently removes it)
     * @param {number} pageId - The page ID
     * @param {number} sectionId - The section ID to delete
     * @returns {Promise<{ success: boolean }>} Success response
     * @throws {Error} When API request fails
     */
    async deleteSection(pageId: number, sectionId: number): Promise<{ success: boolean }> {
        const response = await apiClient.delete(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_REMOVE_SECTION(pageId, sectionId)
        );
        // For 204 No Content responses, return success indicator
        return { success: response.status === 204 || response.status === 200 };
    }
};

// Types for export/import operations
export interface ISectionExportData {
    name: string;
    style_name: string;
    children: ISectionExportData[];
    fields: Record<string, Record<string, {
        content: string;
        meta: any;
    }>>;
}

export interface IPageSectionsExportResponse {
    sectionsData: ISectionExportData[];
}

export interface ISectionExportResponse {
    sectionsData: ISectionExportData[];
}

export interface IImportSectionsRequest {
    sections: ISectionExportData[];
    position?: number;
}

/**
 * Export all sections from a page
 */
export async function exportPageSections(pageId: number): Promise<IBaseApiResponse<IPageSectionsExportResponse>> {
    const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_EXPORT_PAGE(pageId)
    );
    return response.data;
}

/**
 * Export a specific section
 */
export async function exportSection(pageId: number, sectionId: number): Promise<IBaseApiResponse<ISectionExportResponse>> {
    const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_EXPORT_SECTION(pageId, sectionId)
    );
    return response.data;
}

/**
 * Import sections to a page with optional position
 */
export async function importSectionsToPage(
    pageId: number, 
    sections: ISectionExportData[],
    position?: number
): Promise<IBaseApiResponse<any>> {
    const requestBody: IImportSectionsRequest = {
        sections,
        ...(position !== undefined && { position })
    };
    
    const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_IMPORT_TO_PAGE(pageId),
        requestBody
    );
    return response.data;
}

/**
 * Import sections to a parent section with optional position
 */
export async function importSectionsToSection(
    pageId: number, 
    parentSectionId: number, 
    sections: ISectionExportData[],
    position?: number
): Promise<IBaseApiResponse<any>> {
    const requestBody: IImportSectionsRequest = {
        sections,
        ...(position !== undefined && { position })
    };
    
    const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_IMPORT_TO_SECTION(pageId, parentSectionId),
        requestBody
    );
    return response.data;
} 