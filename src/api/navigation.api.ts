/**
 * API client for handling navigation-related API calls.
 * Provides methods for fetching application routes and navigation structure.
 *
 * @module api/navigation.api
 */

import { permissionAwareApiClient } from './base.api';
import { API_CONFIG } from '../config/api.config';
import { IBaseApiResponse } from '../shared';

// Re-export the shared transformer so existing imports keep working.
// The implementation lives in `@selfhelp/shared` so the mobile app and
// the web frontend share a single source of truth.
export { transformPageData } from '../shared';

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
