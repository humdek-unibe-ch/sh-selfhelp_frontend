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

export const NavigationApi = {

    /**
     * Fetches all available routes and navigation items with language-specific titles.
     * This endpoint always contains the title field based on the selected language.
     * @param {number} languageId - The language ID to fetch pages for
     * @returns {Promise<IPageItem[]>} Array of navigation items with localized titles
     * @throws {Error} When API request fails
     */
    async getPagesWithLanguage(languageId: number): Promise<IPageItem[]> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<IPageItem[]>>(
            API_CONFIG.ENDPOINTS.PAGES_GET_ALL_WITH_LANGUAGE,
            languageId
        );
        return response.data.data;
    }
};
