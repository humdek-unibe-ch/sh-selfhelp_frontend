/**
 * Admin Page Keywords API client for handling page keywords-related admin operations.
 * Provides methods for managing page keywords in the admin interface.
 *
 * @module api/admin/page-keywords.api
 */

import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';

export interface IPageKeyword {
    value: string;
    text: string;
}

export const AdminPageKeywordsApi = {
    /**
     * Fetches all admin page keywords.
     * @returns {Promise<IPageKeyword[]>} Array of page keywords
     * @throws {Error} When API request fails
     */
    async getPageKeywords(): Promise<IPageKeyword[]> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<IPageKeyword[]>>(API_CONFIG.ENDPOINTS.ADMIN_PAGE_KEYWORDS_GET_ALL);

        return response.data.data;
    }
};
