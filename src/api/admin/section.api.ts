/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Admin Section API client for handling section-related admin operations.
 * Provides methods for managing sections in the admin interface.
 * 
 * @module api/admin/section.api
 */

import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import { TSectionDetailsResponse, ISectionDetailsData } from '../../types/responses/admin/admin.types';
import type { AxiosRequestConfig } from 'axios';
import { 
    IAddSectionInSectionData,
    ICreateSectionInPageData,
    ICreateSectionInSectionData,
    IUpdateSectionInPageData
} from '../../types/requests/admin/create-section.types';

export const AdminSectionApi = {
    /**
     * Adds an existing section to a page
     * @param {number} pageId - The page ID
     * @param {IAddSectionInSectionData[]} sections - The sections to add and data
     * @returns {Promise<any>} The created section data
     * @throws {Error} When API request fails
     */
    async addSectionToPage(pageId: number, sections: IAddSectionInSectionData[]): Promise<any> {
        const requestBody = {
        sections: sections,
        };
        
        const response = await permissionAwareApiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_ADD_SECTION,
            requestBody,
            pageId
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
        const response = await permissionAwareApiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_UPDATE,
            sectionData,
            pageId,
            sectionId
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
        const response = await permissionAwareApiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_UPDATE,
            sectionData,
            pageId,
            sectionId
        );
        return response.data.data;
    },

    /**
     * Removes a section from a page
     * @param {number} pageId - The page ID
     * @param {number} sectionId - The section ID list to remove
     * @returns {Promise<{ success: boolean }>} Success response
     * @throws {Error} When API request fails
     */
    async removeSectionFromPage(pageId: number, sectionId: number): Promise<{ success: boolean }> {
        const response = await permissionAwareApiClient.delete(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_REMOVE_SECTION,
            pageId,
            sectionId,
        );
        // For 204 No Content responses, return success indicator
        return { success: response.status === 204 || response.status === 200 };
    },

     /**
     * Removes a section from a page
     * @param {number} pageId - The page ID
     * @param {number[]} sectionIds - The section ID list to remove
     * @returns {Promise<{ success: boolean }>} Success response
     * @throws {Error} When API request fails
     */
    async removeBulkSectionsFromPage(pageId: number, sectionIds: number[]): Promise<any> {
        const response = await permissionAwareApiClient.delete(
          API_CONFIG.ENDPOINTS.ADMIN_PAGES_BULK_REMOVE_SECTION,
          pageId,
          {
            data: { sectionIds },
          },
        );
        return response.data?.data ?? {
            success: response.status === 204 || response.status === 200,
            deleted_count: sectionIds.length,
        };
    },

    /**
     * Adds an existing section to another section
     * @param {number} pageId - The page ID
     * @param {number} parentSectionId - The parent section ID
     * @param {IAddSectionInSectionData[]} sections - The sections to add with data
     * @returns {Promise<any>} The created section data
     * @throws {Error} When API request fails
     */
    async addSectionToSection(pageId: number, parentSectionId: number, sections: IAddSectionInSectionData[]): Promise<any> {
        const requestBody = {
        sections,
        };
        
        const response = await permissionAwareApiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_ADD,
            requestBody,
            pageId,
            parentSectionId
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
        const response = await permissionAwareApiClient.delete(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_REMOVE,
            pageId,
            parentSectionId,
            childSectionId
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
    async createSectionInPage(pageId: number, sections: ICreateSectionInPageData | ICreateSectionInPageData[]): Promise<any> {
        const response = await permissionAwareApiClient.post<IBaseApiResponse<any>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_CREATE_SECTION,
            sections,
            pageId
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
    async createSectionInSection(
        pageId: number,
        parentSectionId: number,
        sectionData: ICreateSectionInSectionData | ICreateSectionInSectionData[]
    ): Promise<any> {
        const response = await permissionAwareApiClient.post<IBaseApiResponse<any>>(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_CREATE_CHILD,
            sectionData,
            pageId,
            parentSectionId
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
        const response = await permissionAwareApiClient.get<TSectionDetailsResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_GET_ONE,
            pageId,
            sectionId
        );
        return response.data.data;
    },

    /**
     * Permanently destroys a section everywhere (all pages lose it).
     * @param {number} sectionId - The section ID to delete
     * @returns {Promise<{ success: boolean }>} Success response
     * @throws {Error} When API request fails
     */
    async deleteSection(sectionId: number): Promise<{ success: boolean }> {
        const response = await permissionAwareApiClient.delete(
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_DELETE,
            sectionId
        );
        return { success: response.status === 204 || response.status === 200 };
    }
};

// Types for export/import operations
export interface ISectionExportFieldEntry {
    content: string;
    meta?: string;
}

export interface ISectionExportData {
    section_name?: string;
    style_name: string;
    fields?: Record<string, Record<string, ISectionExportFieldEntry>>;
    global_fields?: Partial<{
        condition: string | null;
        data_config: string | null;
        css: string | null;
        css_mobile: string | null;
        debug: boolean;
    }>;
    children?: ISectionExportData[];
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

export interface IImportValidationError {
    path: string;
    type: string;
    detail: string;
}

export interface IImportSectionsResponse {
    sections?: ISectionExportData[];
    imported_count?: number;
    [key: string]: unknown;
}

/**
 * Export all sections from a page
 */
export async function exportPageSections(pageId: number): Promise<IBaseApiResponse<IPageSectionsExportResponse>> {
    const response = await permissionAwareApiClient.get(
        API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_EXPORT_PAGE,
        pageId
    );
    return response.data;
}

/**
 * Export a specific section
 */
export async function exportSection(pageId: number, sectionId: number): Promise<IBaseApiResponse<ISectionExportResponse>> {
    const response = await permissionAwareApiClient.get(
        API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_EXPORT_SECTION,
        pageId,
        sectionId
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
): Promise<IBaseApiResponse<IImportSectionsResponse>> {
    const requestBody: IImportSectionsRequest = {
        sections,
        ...(position !== undefined && { position })
    };
    
    // permissionAwareApiClient.post signature: (endpointConfig, data, ...routeParams)
    const response = await permissionAwareApiClient.post(
        API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_IMPORT_TO_PAGE,
        requestBody,
        pageId
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
): Promise<IBaseApiResponse<IImportSectionsResponse>> {
    const requestBody: IImportSectionsRequest = {
        sections,
        ...(position !== undefined && { position })
    };

    // permissionAwareApiClient.post signature: (endpointConfig, data, ...routeParams)
    const response = await permissionAwareApiClient.post(
        API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_IMPORT_TO_SECTION,
        requestBody,
        pageId,
        parentSectionId
    );
    return response.data;
}

/**
 * Fetch the static AI section-generation prompt template as raw markdown text.
 * Used by the `Copy AI prompt` button in the import UI.
 */
export async function fetchAiSectionPromptTemplate(): Promise<string> {
    const textResponseConfig: AxiosRequestConfig = {
        headers: { Accept: 'text/markdown' },
        responseType: 'text',
        transformResponse: [(raw: string): string => raw],
    };

    const response = await permissionAwareApiClient.get<string>(
        API_CONFIG.ENDPOINTS.ADMIN_AI_SECTION_PROMPT_TEMPLATE,
        textResponseConfig
    );
    return response.data;
}
