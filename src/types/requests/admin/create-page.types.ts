/**
 * Request interface for creating a new page
 * Based on backend API route: admin_create_page
 */
export interface ICreatePageRequest {
    /** Page keyword (required) */
    keyword: string;
    
    /** Page access type ID (required) - should be the lookup code */
    page_access_type_id: string;
    
    /** Whether the page is headless (optional) */
    is_headless?: boolean;
    
    /** Whether the page has open access (optional) */
    is_open_page?: boolean;
    
    /** Custom URL pattern (optional) */
    url?: string;
    
    /** Navigation menu position (optional) */
    nav_position?: number;
    
    /** Footer menu position (optional) */
    footer_position?: number;
    
    /** Parent page ID (optional) */
    parent?: number;
} 