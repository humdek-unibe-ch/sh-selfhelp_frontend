/**
 * API client for handling lookups-related API calls.
 * Provides methods for fetching lookup data from the backend.
 * 
 * @module api/lookups.api
 */

import { apiClient } from './base.api';
import { API_CONFIG } from '../config/api.config';
import { ILookupsResponse, ILookup } from '../types/responses/admin/lookups.types';

export const LookupsApi = {
    /**
     * Fetches all lookups from the backend.
     * @returns {Promise<ILookup[]>} Array of lookup items
     * @throws {Error} When API request fails
     */
    async getLookups(): Promise<ILookup[]> {
        const response = await apiClient.get<ILookupsResponse>(API_CONFIG.ENDPOINTS.LOOKUPS);
        return response.data.data;
    }
}; 