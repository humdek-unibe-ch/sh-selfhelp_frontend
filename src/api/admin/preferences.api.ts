/**
 * API client for handling CMS preferences and configuration.
 * Provides methods for fetching and updating system preferences.
 *
 * CMS Preferences vs User Preferences:
 * - CMS Preferences: Global system settings managed by admins (this module)
 * - User Preferences: Individual user settings like timezone, language (auth.api.ts)
 *
 * @module api/admin/preferences.api
 */

import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';

/**
 * CMS Preferences interface
 * Contains global system configuration settings
 */
export interface ICMSPreferences {
    /** Default language ID for the CMS system */
    default_language_id?: number;
    /** Whether anonymous (non-authenticated) users can access the system */
    anonymous_users?: boolean;
    /** Firebase configuration as JSON string for push notifications and services */
    firebase_config?: string;
}

/**
 * API client for CMS preferences operations
 */
export const PreferencesApi = {
    /**
     * Fetches current CMS preferences from the backend
     *
     * @returns {Promise<ICMSPreferences>} Current system preferences
     * @throws {Error} When API request fails or user lacks permissions
     *
     * @example
     * ```typescript
     * const preferences = await PreferencesApi.getCmsPreferences();
     * console.log('Default language:', preferences.default_language_id);
     * ```
     */
    async getCmsPreferences(): Promise<ICMSPreferences> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<ICMSPreferences>>(
            API_CONFIG.ENDPOINTS.ADMIN_CMS_PREFERENCES_GET
        );
        return response.data.data;
    },

    /**
     * Updates CMS preferences with new values
     *
     * @param {ICMSPreferences} preferences - New CMS preferences to save
     * @returns {Promise<ICMSPreferences>} Updated preferences from server
     * @throws {Error} When update fails or validation errors occur
     *
     * @example
     * ```typescript
     * const updatedPrefs = await PreferencesApi.updateCmsPreferences({
     *     anonymous_users: false,
     *     default_language_id: 1
     * });
     * ```
     *
     * @note Firebase config is validated as JSON format
     * @note All preference updates are logged for audit purposes
     */
    async updateCmsPreferences(preferences: ICMSPreferences): Promise<ICMSPreferences> {
        const response = await permissionAwareApiClient.put<IBaseApiResponse<ICMSPreferences>>(
            API_CONFIG.ENDPOINTS.ADMIN_CMS_PREFERENCES_UPDATE,
            preferences
        );
        return response.data.data;
    }
}; 