/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Admin Page API client for handling page-related admin operations.
 * Provides methods for managing pages in the admin interface.
 * 
 * @module api/admin/page.api
 */

import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import { type IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import { type IAdminPage } from '../../types/responses/admin/admin.types';
import { type ICreatePageRequest } from '../../types/requests/admin/create-page.types';
import { type IUpdatePageRequest } from '../../types/requests/admin/update-page.types';
import { type IPageFieldsResponse, type IPageFieldsData, type TPageFieldsResponse, type IPageSectionWithFields } from '../../types/common/pages.type';
import { type IRestoreFromVersionResponse } from '../../types/responses/admin/page-version.types';
import {
    type IPageBundle,
    type IPageImportOptions,
    type IPageImportValidationReport,
    type IPageImportResult,
    type IPageExampleBundle
} from '../../types/requests/admin/page-export-import.types';
import {
    type ICreateCmsAppRequest,
    type ICreateCmsAppResult
} from '../../types/requests/admin/cms-app-wizard.types';

export const AdminPageApi = {
    /**
     * Fetches all admin pages.
     * @returns {Promise<IAdminPage[]>} Array of admin pages
     * @throws {Error} When API request fails
     */
    async getAdminPages(): Promise<IAdminPage[]> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<IAdminPage[]>>(API_CONFIG.ENDPOINTS.ADMIN_PAGES_GET_ALL);
        return response.data.data;
    },

    /**
     * Fetches page fields for a specific page by ID.
     * @param {number} pageId - The page ID to fetch fields for
     * @returns {Promise<IPageFieldsData>} Page fields response with page details
     * @throws {Error} When API request fails
     */
    async getPageFields(pageId: number): Promise<IPageFieldsData> {
        const response = await permissionAwareApiClient.get<TPageFieldsResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_GET_ONE,
            pageId
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
        const response = await permissionAwareApiClient.get<IPageFieldsResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_SECTIONS_GET,
            pageId
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
        const response = await permissionAwareApiClient.post<IBaseApiResponse<IAdminPage>>(
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
        const response = await permissionAwareApiClient.put<IBaseApiResponse<IAdminPage>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_UPDATE,
            updateData,
            pageId
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
        const response = await permissionAwareApiClient.delete(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_DELETE,
            pageId
        );
        // For 204 No Content responses, return success indicator
        return { success: response.status === 204 || response.status === 200 };
    },

    /**
     * Restores sections from a published version to the current draft
     * @param {number} pageId - The page ID
     * @param {number} versionId - The version ID to restore from
     * @returns {Promise<IRestoreFromVersionResponse>} Restore response
     * @throws {Error} When API request fails
     */
    async restoreFromVersion(pageId: number, versionId: number): Promise<IRestoreFromVersionResponse> {
        const response = await permissionAwareApiClient.post<IRestoreFromVersionResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGE_VERSIONS_RESTORE_FROM_VERSION,
            pageId,
            versionId
        );
        return response.data;
    },

    /**
     * Exports one or more pages as a portable bundle (issue #30, Phase 5).
     * @param {number[]} pageIds - Ids of the pages to include in the bundle
     * @returns {Promise<IPageBundle>} The portable page bundle
     * @throws {Error} When API request fails
     */
    async exportPages(pageIds: number[]): Promise<IPageBundle> {
        const response = await permissionAwareApiClient.post<IBaseApiResponse<IPageBundle>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_EXPORT,
            { pageIds }
        );
        return response.data.data;
    },

    /**
     * Lists the shipped importable example page bundles (issue #30, decision E),
     * so the import UI can offer ready-made "Example bundles".
     * @returns {Promise<IPageExampleBundle[]>} The available example bundles
     * @throws {Error} When API request fails
     */
    async getExampleBundles(): Promise<IPageExampleBundle[]> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<{ examples: IPageExampleBundle[] }>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_EXAMPLES
        );
        return response.data.data.examples;
    },

    /**
     * Suggests the related page ids that belong in a bundle with the given page.
     * @param {number} pageId - The seed page id
     * @returns {Promise<number[]>} Seed id plus any related ids (deduplicated)
     * @throws {Error} When API request fails
     */
    async suggestExportBundle(pageId: number): Promise<number[]> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<{ page_ids: number[] }>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_EXPORT_SUGGEST,
            pageId
        );
        return response.data.data.page_ids;
    },

    /**
     * Dry-run validation of a page bundle before import (issue #30, Phase 5).
     * @param {IPageBundle} bundle - The bundle to validate
     * @param {IPageImportOptions} options - Import behaviour toggles
     * @returns {Promise<IPageImportValidationReport>} Structured validation report
     * @throws {Error} When API request fails
     */
    async validateImportPages(bundle: IPageBundle, options: IPageImportOptions = {}): Promise<IPageImportValidationReport> {
        const response = await permissionAwareApiClient.post<IBaseApiResponse<IPageImportValidationReport>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_IMPORT_VALIDATE,
            { bundle, options }
        );
        return response.data.data;
    },

    /**
     * Imports a validated page bundle (issue #30, Phase 5).
     * @param {IPageBundle} bundle - The bundle to import
     * @param {IPageImportOptions} options - Import behaviour toggles
     * @returns {Promise<IPageImportResult>} The created pages
     * @throws {Error} When API request fails
     */
    async importPages(bundle: IPageBundle, options: IPageImportOptions = {}): Promise<IPageImportResult> {
        const response = await permissionAwareApiClient.post<IBaseApiResponse<IPageImportResult>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_IMPORT,
            { bundle, options }
        );
        return response.data.data;
    },

    /**
     * Runs the CMS-in-CMS "Create list + detail pages" wizard (issue #30, Phase 6).
     * Atomically scaffolds the public and/or admin list+detail page pairs bound
     * to a data table, with DB-driven routes and entry-list/entry-record holders.
     * @param {ICreateCmsAppRequest} payload - The wizard configuration
     * @returns {Promise<ICreateCmsAppResult>} The created pages
     * @throws {Error} When API request fails
     */
    async createCmsApp(payload: ICreateCmsAppRequest): Promise<ICreateCmsAppResult> {
        const response = await permissionAwareApiClient.post<IBaseApiResponse<ICreateCmsAppResult>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_CMS_APP,
            payload
        );
        return response.data.data;
    }
}; 