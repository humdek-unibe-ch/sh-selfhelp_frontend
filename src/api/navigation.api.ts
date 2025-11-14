/**
 * API client for handling navigation-related API calls.
 * Provides methods for fetching application routes and navigation structure.
 * 
 * @module api/navigation.api
 */

import { permissionAwareApiClient } from './base.api';
import { API_CONFIG } from '../config/api.config';
import { IBaseApiResponse } from '../types/responses/common/response-envelope.types';
import { IPageItem } from '../types/common/pages.type';

/**
 * Transforms raw API page data to match the IPageItem interface
 * Handles property name mismatches between API and frontend interfaces
 */
export function transformPageData(apiPage: any): IPageItem {
    return {
        // Map API property names to interface property names
        id: apiPage.id_pages,
        keyword: apiPage.keyword,
        url: apiPage.url,
        parent_page_id: apiPage.parent,
        is_headless: Boolean(apiPage.is_headless),
        nav_position: apiPage.nav_position,
        footer_position: apiPage.footer_position,
        is_system: Boolean(apiPage.is_system),
        title: apiPage.title,
        children: apiPage.children ? apiPage.children.map(transformPageData) : [],

        // ACL permissions (optional fields)
        id_users: apiPage.id_users,
        id_pages: apiPage.id_pages,
        acl_select: apiPage.acl_select,
        acl_insert: apiPage.acl_insert,
        acl_update: apiPage.acl_update,
        acl_delete: apiPage.acl_delete,
        id_type: apiPage.id_type,
        id_pageAccessTypes: apiPage.id_pageAccessTypes,
    };
}

export const NavigationApi = {

    /**
     * Fetches all available routes and navigation items with language-specific titles.
     * This endpoint always contains the title field based on the selected language.
     * Returns raw API data - transformation happens in React Query select function for caching.
     * @param {number} languageId - The language ID to fetch pages for
     * @returns {Promise<any[]>} Raw API response data (transformed in React Query select)
     * @throws {Error} When API request fails
     */
    async getPagesWithLanguage(languageId: number): Promise<any[]> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<any[]>>(
            API_CONFIG.ENDPOINTS.PAGES_GET_ALL_WITH_LANGUAGE,
            languageId
        );

        // Return raw API data - transformation will happen in React Query select for caching
        return response.data.data;
    }
};
