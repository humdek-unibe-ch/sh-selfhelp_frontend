/**
 * Request interface for updating an existing page
 * Based on backend API route: admin_update_page
 */

export interface IUpdatePageData {
    /** Page keyword */
    keyword: string;
    
    /** Page URL */
    url: string;
    
    /** Whether the page is headless */
    headless: boolean;
    
    /** Navigation menu position (null if not in nav) */
    navPosition: number | null;
    
    /** Footer menu position (null if not in footer) */
    footerPosition: number | null;
    
    /** Whether the page has open access */
    openAccess: boolean;
    
    /** Page access type code */
    pageAccessType: string;
}

export interface IUpdatePageField {
    /** Field ID from database */
    fieldId: number;
    
    /** Language ID (1 for properties, actual language ID for content) */
    languageId: number;
    
    /** Field content */
    content: string;
    
    /** Field name (for debugging) */
    fieldName?: string;
    
    /** Language code (for debugging) */
    languageCode?: string;
}

export interface IUpdatePageRequest {
    /** Page basic properties */
    pageData: IUpdatePageData;
    
    /** Field translations array */
    fields: IUpdatePageField[];
} 