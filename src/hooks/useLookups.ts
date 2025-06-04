/**
 * React Query hook for fetching and managing lookups data.
 * Provides processed lookups with efficient access patterns.
 * 
 * @module hooks/useLookups
 */

import { useQuery } from '@tanstack/react-query';
import { LookupsApi } from '../api/lookups.api';
import { ILookup, IProcessedLookups, ILookupMap, ILookupsByType } from '../types/responses/admin/lookups.types';
import { debug } from '../utils/debug-logger';

/**
 * React Query hook for fetching lookups data.
 * Caches data for 24 hours and processes it into efficient access patterns.
 * 
 * @returns {Object} Query result with processed lookups data
 */
export function useLookups() {
    return useQuery({
        queryKey: ['lookups'],
        queryFn: LookupsApi.getLookups,
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
        gcTime: 24 * 60 * 60 * 1000, // 24 hours (formerly cacheTime)
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