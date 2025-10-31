/**
 * API client for handling CMS preferences and configuration.
 * Provides methods for fetching and updating system preferences.
 * 
 * @module api/admin/preferences.api
 */

import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';

export interface ICMSPreferences {
    callback_api_key?: string;
    default_language_id?: number;
    anonymous_users?: boolean;
    firebase_config?: string; // JSON string
}

export const PreferencesApi = {
    /**
     * Fetches current CMS preferences
     * @returns {Promise<ICMSPreferences>} Current preferences
     * @throws {Error} When API request fails
     */
    async getCmsPreferences(): Promise<ICMSPreferences> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<ICMSPreferences>>(
            API_CONFIG.ENDPOINTS.ADMIN_CMS_PREFERENCES_GET
        );
        return response.data.data;
    },

    /**
     * Updates CMS preferences
     * @param {ICMSPreferences} preferences - New CMS preferences
     * @returns {Promise<ICMSPreferences>} Updated preferences
     * @throws {Error} When update fails
     */
    async updateCmsPreferences(preferences: ICMSPreferences): Promise<ICMSPreferences> {
        const response = await permissionAwareApiClient.put<IBaseApiResponse<ICMSPreferences>>(
            API_CONFIG.ENDPOINTS.ADMIN_CMS_PREFERENCES_UPDATE,
            preferences
        );
        return response.data.data;
    }
}; 