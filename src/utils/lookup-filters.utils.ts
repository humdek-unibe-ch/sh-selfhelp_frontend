/**
 * Utility functions for filtering and processing lookups data.
 * Provides reusable functions for extracting specific lookup types from the centralized lookups API.
 * 
 * @module utils/lookup-filters.utils
 */

import { ILookup } from '../types/responses/admin/lookups.types';

/**
 * Filter lookups by type code and convert to Select component data format.
 * 
 * @param {ILookup[]} lookups - Array of all lookups
 * @param {string} typeCode - The type code to filter by
 * @returns {Array<{value: string, label: string}>} Array of options for Select component
 */
export function filterLookupsByType(lookups: ILookup[], typeCode: string): Array<{value: string, label: string}> {
    return lookups
        .filter(lookup => lookup.typeCode === typeCode && lookup.lookupValue && lookup.lookupValue.trim() !== '')
        .map(lookup => ({
            value: lookup.lookupValue,
            label: lookup.lookupValue
        }));
}

/**
 * Get scheduled job statuses from lookups.
 * 
 * @param {ILookup[]} lookups - Array of all lookups
 * @returns {Array<{value: string, label: string}>} Array of status options
 */
export function getScheduledJobStatuses(lookups: ILookup[]): Array<{value: string, label: string}> {
    return filterLookupsByType(lookups, 'scheduledJobsStatus');
}

/**
 * Get scheduled job types from lookups.
 * 
 * @param {ILookup[]} lookups - Array of all lookups
 * @returns {Array<{value: string, label: string}>} Array of job type options
 */
export function getScheduledJobTypes(lookups: ILookup[]): Array<{value: string, label: string}> {
    return filterLookupsByType(lookups, 'jobTypes');
}

/**
 * Get scheduled job search date types from lookups.
 * 
 * @param {ILookup[]} lookups - Array of all lookups
 * @returns {Array<{value: string, label: string}>} Array of date type options
 */
export function getScheduledJobSearchDateTypes(lookups: ILookup[]): Array<{value: string, label: string}> {
    return filterLookupsByType(lookups, 'scheduledJobsSearchDateTypes');
}

/**
 * Get any lookup type with fallback data.
 * 
 * @param {ILookup[]} lookups - Array of all lookups
 * @param {string} typeCode - The type code to filter by
 * @param {Array<{value: string, label: string}>} fallbackData - Fallback data if no lookups found
 * @returns {Array<{value: string, label: string}>} Array of options with fallback
 */
export function getLookupsWithFallback(
    lookups: ILookup[], 
    typeCode: string, 
    fallbackData: Array<{value: string, label: string}>
): Array<{value: string, label: string}> {
    const filteredLookups = filterLookupsByType(lookups, typeCode);
    return filteredLookups.length > 0 ? filteredLookups : fallbackData;
} 