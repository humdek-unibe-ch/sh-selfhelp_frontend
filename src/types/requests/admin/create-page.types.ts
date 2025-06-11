/**
 * Request interface for creating a new page
 * Based on backend API route: admin_create_page
 * Updated to match JSON schema validation requirements
 */
export interface ICreatePageRequest {
    /** Page keyword (required) - unique identifier for the page */
    keyword: string;
    
    /** ID of the page type (optional) */
    pageTypeId?: number;
    
    /** Access type code from lookups with typeCode=pageAccessTypes (required) */
    pageAccessTypeCode: string;
    
    /** Whether the page is headless (optional, default: false) */
    headless?: boolean;
    
    /** Whether the page has open access (optional, default: false) */
    openAccess?: boolean;
    
    /** URL path for the page (optional) */
    url?: string | null;
    
    /** HTTP methods supported by the page - pipe separated list (optional) */
    protocol?: string | null;
    
    /** Navigation position (optional) */
    navPosition?: number | null;
    
    /** Footer position (optional) */
    footerPosition?: number | null;
    
    /** ID of the parent page (optional) */
    parent?: number | null;
} 