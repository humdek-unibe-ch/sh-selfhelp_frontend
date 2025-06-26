/**
 * React Query hook for fetching and managing lookups data.
 * Provides processed lookups with efficient access patterns.
 * 
 * @module hooks/useLookups
 */

import { useQuery } from '@tanstack/react-query';
import { LookupsApi } from '../api/lookups.api';
import { ILookup, IProcessedLookups, ILookupMap, ILookupsByType } from '../types/responses/admin/lookups.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useAuth } from './useAuth';
import { getAccessToken } from '../utils/auth.utils';
import { debug } from '../utils/debug-logger';

/**
 * React Query hook for fetching lookups data.
 * Uses global cache configuration but with longer cache time since lookups are static data.
 * Processes data into efficient access patterns.
 * 
 * @returns {Object} Query result with processed lookups data
 */
export function useLookups() {
    return useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.LOOKUPS,
        queryFn: LookupsApi.getLookups,
        staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.staleTime, // Use longer cache for static data
        gcTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        select: (lookups: ILookup[]): IProcessedLookups => {
            // Create lookup map with typeCode_lookupCode as key
            const lookupMap: ILookupMap = {};
            lookups.forEach(lookup => {
                const key = `${lookup.typeCode}_${lookup.lookupCode}`;
                lookupMap[key] = lookup;
            });

            // Group lookups by typeCode
            const lookupsByType: ILookupsByType = {};
            lookups.forEach(lookup => {
                if (!lookupsByType[lookup.typeCode]) {
                    lookupsByType[lookup.typeCode] = [];
                }
                lookupsByType[lookup.typeCode].push(lookup);
            });

            debug('Processed lookups data', 'useLookups', {
                totalLookups: lookups.length,
                typesCount: Object.keys(lookupsByType).length,
                mapKeysCount: Object.keys(lookupMap).length
            });

            return {
                lookups,
                lookupMap,
                lookupsByType
            };
        }
    });
}

/**
 * Helper hook to get lookups by specific type.
 * 
 * @param {string} typeCode - The type code to filter by
 * @returns {ILookup[]} Array of lookups for the specified type
 */
export function useLookupsByType(typeCode: string): ILookup[] {
    const { data } = useLookups();
    return data?.lookupsByType[typeCode] || [];
}

/**
 * Helper hook to get a specific lookup by type and code.
 * 
 * @param {string} typeCode - The type code
 * @param {string} lookupCode - The lookup code
 * @returns {ILookup | undefined} The specific lookup or undefined if not found
 */
export function useLookup(typeCode: string, lookupCode: string): ILookup | undefined {
    const { data } = useLookups();
    const key = `${typeCode}_${lookupCode}`;
    return data?.lookupMap[key];
} 