/**
 * Page Versioning Response Types
 * Type definitions for page versioning and publishing responses
 */

/**
 * Page version entity
 */
export interface IPageVersion {
    id: number;
    id_pages: number;
    version_number: number;
    version_name: string | null;
    page_json?: any; // Complete page JSON structure
    created_by: number | { id: number; name: string } | null;
    created_at: string;
    published_at: string | null;
    metadata: {
        description?: string;
        tags?: string[];
        [key: string]: any;
    } | null;
    is_published?: boolean;
}

/**
 * Version history response
 */
export interface IVersionHistoryResponse {
    versions: IPageVersion[];
    total: number;
    current_published_version_id: number | null;
}

/**
 * Version comparison response
 */
export interface IVersionComparisonResponse {
    version1: IPageVersion;
    version2: IPageVersion;
    diff: string | any; // String for unified/side_by_side, object for json_patch/summary
    format: 'unified' | 'side_by_side' | 'json_patch' | 'summary';
}

/**
 * Publish/unpublish response
 */
export interface IPublishResponse {
    version: IPageVersion;
    message: string;
}

/**
 * Unpublished changes status response
 */
export interface IUnpublishedChangesResponse {
    page_id: number;
    has_unpublished_changes: boolean;
    current_published_version_id: number | null;
    current_published_version_number: number | null;
}

