/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * API client for handling navigation-related API calls.
 * Provides methods for fetching application routes and navigation structure.
 *
 * @module api/navigation.api
 */

import { permissionAwareApiClient } from './base.api';
import { API_CONFIG } from '../config/api.config';
import { transformPageData, type IBaseApiResponse, type INavigationPayload } from '../shared';

// Re-export the shared transformer so existing imports keep working.
// The implementation lives in `@selfhelp/shared` so the mobile app and
// the web frontend share a single source of truth.
export { transformPageData };

/** Raw navigation page shape accepted by the shared {@link transformPageData}. */
type TRawNavigationPage = Parameters<typeof transformPageData>[0];

export const NavigationApi = {

    /**
     * Fetches all available routes and navigation items with language-specific titles.
     * This endpoint always contains the title field based on the selected language.
     * Returns raw API data - transformation happens in React Query select function for caching.
     * @param {number} languageId - The language ID to fetch pages for
     * @returns {Promise<unknown[]>} Raw API response data (transformed in React Query select)
     * @throws {Error} When API request fails
     */
    async getPagesWithLanguage(languageId: number): Promise<TRawNavigationPage[]> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<TRawNavigationPage[]>>(
            API_CONFIG.ENDPOINTS.PAGES_GET_ALL_WITH_LANGUAGE,
            languageId
        );

        // Return raw API data - transformation will happen in React Query select for caching
        return response.data.data;
    },

    /**
     * Fetches the resolved navigation payload (menus, startup, search).
     */
    async getNavigation(languageId: number): Promise<INavigationPayload> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<INavigationPayload>>(
            API_CONFIG.ENDPOINTS.NAVIGATION_GET,
            languageId,
        );
        return response.data.data;
    },

    async recordLastVisited(payload: {
        page_id: number;
        keyword: string;
        url?: string;
        platform?: 'web' | 'mobile';
    }): Promise<void> {
        await permissionAwareApiClient.put(
            API_CONFIG.ENDPOINTS.NAVIGATION_LAST_VISITED,
            payload,
        );
    },
};
