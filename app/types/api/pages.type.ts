/**
 * Type definitions for pages API responses.
 * These types match the backend API response format for pages endpoints.
 */

/**
 * Interface for a page object returned by the backend API.
 */
export interface IPage {
    id_users: number;
    id_pages: number;
    acl_select: 0 | 1;
    acl_insert: 0 | 1;
    acl_update: 0 | 1;
    acl_delete: 0 | 1;
    keyword: string;
    url: string;
    protocol: string;
    id_actions: number;
    id_navigation_section: number | null;
    parent: number | null;
    is_headless: 0 | 1;
    nav_position: number | null;
    footer_position: number | null;
    id_type: number;
    id_pageAccessTypes: number;
}

/**
 * Interface for the pages response data structure.
 */
export interface IPagesResponse {
    pages: IPage[];
}
