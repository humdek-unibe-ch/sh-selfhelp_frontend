/**
 * API client for handling navigation-related API calls.
 * Provides methods for fetching application routes and navigation structure.
 * 
 * @module api/navigation.api
 */

import { apiClient } from './base.api';
import { API_CONFIG } from '../config/api.config';
import { IBaseApiResponse } from '../types/responses/common/response-envelope.types';
import { IPageItem } from '../types/responses/frontend/frontend.types';

export const NavigationApi = {
    /**
     * Fetches all available routes and navigation items from the API.
     * @returns {Promise<IPageItem[]>} Array of navigation items
     * @throws {Error} When API request fails
     */
    async getPages(): Promise<IPageItem[]> {
        const response = await apiClient.get<IBaseApiResponse<IPageItem[]>>(API_CONFIG.ENDPOINTS.PAGES_GET_ALL);
        return response.data.data;
    }
};
