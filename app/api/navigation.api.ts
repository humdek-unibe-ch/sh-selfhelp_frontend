/**
 * API client for handling navigation-related API calls.
 * Provides methods for fetching application routes and navigation structure.
 * 
 * @module api/navigation.api
 */

import { apiClient } from './base.api';
import { API_CONFIG } from '@/config/api.config';
import { IPage } from '@/types/api/pages.type';
import { IBaseApiResponse } from '@/types/responses/common/response-envelope.types';
import { IFrontendPagesData } from '@/types/responses/frontend/frontend.types';

export const NavigationApi = {
    /**
     * Fetches all available routes and navigation items from the API.
     * @returns {Promise<IPage[]>} Array of navigation items
     * @throws {Error} When API request fails
     */
    async getPages(): Promise<IPage[]> {
        const response = await apiClient.get<IBaseApiResponse<IFrontendPagesData>>(API_CONFIG.ENDPOINTS.PAGES);
        return response.data.data.pages;
    }
};
