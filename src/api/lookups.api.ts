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
        const response = await apiClient.get<ILookupsResponse>(API_CONFIG.ENDPOINTS.ADMIN_LOOKUPS);
        return response.data.data;
    },

    /**
     * Gets resource type ID by lookup code
     * @param lookupCode The lookup code for the resource type
     * @returns {Promise<number>} Resource type ID
     * @throws {Error} When lookup is not found
     */
    async getResourceTypeId(lookupCode: string): Promise<number> {
        const lookups = await this.getLookups();
        const resourceType = lookups.find(
            lookup => lookup.typeCode === 'resourceTypes' && lookup.lookupCode === lookupCode
        );

        if (!resourceType) {
            throw new Error(`Resource type not found for lookup code: ${lookupCode}`);
        }

        return resourceType.id;
    },

    /**
     * Gets multiple resource type IDs by lookup codes
     * @param lookupCodes Array of lookup codes
     * @returns {Promise<Record<string, number>>} Map of lookup codes to IDs
     */
    async getResourceTypeIds(lookupCodes: string[]): Promise<Record<string, number>> {
        const lookups = await this.getLookups();
        const result: Record<string, number> = {};

        for (const lookupCode of lookupCodes) {
            const resourceType = lookups.find(
                lookup => lookup.typeCode === 'resourceTypes' && lookup.lookupCode === lookupCode
            );

            if (resourceType) {
                result[lookupCode] = resourceType.id;
            }
        }

        return result;
    }
}; 