/**
 * Admin Style API client for handling style-related admin operations.
 * Provides methods for managing styles in the admin interface.
 * 
 * @module api/admin/style.api
 */

import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import { TStyleGroupsResponse, IStyleGroup } from '../../types/responses/admin/styles.types';

export const AdminStyleApi = {
    /**
     * Fetches all style groups.
     * @returns {Promise<IStyleGroup[]>} Array of style groups
     * @throws {Error} When API request fails
     */
    async getStyleGroups(): Promise<IStyleGroup[]> {
        const response = await permissionAwareApiClient.get<TStyleGroupsResponse>(API_CONFIG.ENDPOINTS.ADMIN_STYLES_GET_ALL);
        return response.data.data;
    }
}; 