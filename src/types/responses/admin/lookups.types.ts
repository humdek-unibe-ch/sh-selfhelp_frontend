/**
 * TypeScript interfaces for lookups API responses and related types.
 * 
 * @module types/responses/admin/lookups.types
 */

export interface ILookup {
    id: number;
    typeCode: string;
    lookupCode: string;
    lookupValue: string;
    lookupDescription: string;
}

export interface ILookupsResponse {
    status: number;
    message: string;
    error: null | string;
    logged_in: boolean;
    meta: {
        version: string;
        timestamp: string;
    };
    data: ILookup[];
}

// Lookup maps for efficient access
export interface ILookupMap {
    [key: string]: ILookup; // key format: typeCode_lookupCode
}

export interface ILookupsByType {
    [typeCode: string]: ILookup[];
}

// Processed lookups data structure
export interface IProcessedLookups {
    lookups: ILookup[];
    lookupMap: ILookupMap;
    lookupsByType: ILookupsByType;
} 