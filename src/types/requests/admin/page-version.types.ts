/**
 * Page Versioning Request Types
 * Type definitions for page versioning and publishing requests
 */

/**
 * Request to publish a new version
 */
export interface IPublishVersionRequest {
    version_name?: string;
    metadata?: {
        description?: string;
        tags?: string[];
        [key: string]: any;
    };
}

/**
 * Query parameters for version list
 */
export interface IVersionListParams {
    limit?: number;
    offset?: number;
}

/**
 * Query parameters for version details
 */
export interface IVersionDetailsParams {
    include_page_json?: boolean;
}

/**
 * Query parameters for version comparison
 */
export interface IVersionCompareParams {
    format?: 'unified' | 'side_by_side' | 'json_patch' | 'summary';
}

