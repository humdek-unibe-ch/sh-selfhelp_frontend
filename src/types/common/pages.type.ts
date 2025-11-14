/**
 * COMPREHENSIVE PAGE TYPE SYSTEM
 * Single source of truth for ALL page-related types
 * Consolidated from: pages.type.ts, page-details.types.ts, frontend.types.ts
 */

import { IContentField, TStyleName } from '../common/styles.types';
import type { IBaseApiResponse } from '../responses/common/response-envelope.types';
import { IFieldConfig } from '../requests/admin/fields.types';

// ==================== UNIFIED SECTION/FIELD TYPES ====================

/**
 * Base interface for hierarchical page sections/fields
 * Consolidates IPageField, IPageSection, and IBaseStyle commonalities
 */

export interface IBasePageSection {
    id: number;
    section_name: string;
    id_styles: number;
    style_name: TStyleName;
    position: number;
    level: number | { content: string; meta: string | null };
    path: string;
    children: IBasePageSection[];
}

/**
 * Extended section interface with direct fields from API response
 * Matches the actual API response structure where fields are direct properties
 * Extends IBaseStyle for compatibility with TStyle union type
 */
export interface IPageSectionWithFields extends IBasePageSection {
    can_have_children: number | null;
    condition: string | null;
    css: string | null;
    css_mobile: string | null;
    debug: number | null;
    data_config: string | number | null;
    section_data: any[];
    fields: Record<string, IContentField<any>>;
    // Override children to be more specific
    children: IPageSectionWithFields[];    
}

// ==================== UNIFIED PAGE METADATA TYPES ====================

/**
 * Base page metadata interface
 * Consolidates common fields from IPageItem and IPageDetails
 */
export interface IBasePageInfo {
    id: number;
    keyword: string;
    url: string | null;
    parent_page_id: number | null;
    is_headless: boolean;
    nav_position: number | null;
    footer_position: number | null;
    is_system?: boolean;
}

/**
 * Frontend page item with ACL permissions
 * Replaces IPageItem from frontend.types.ts
 */
export interface IPageItem extends IBasePageInfo {
    id_users?: number;
    id_pages?: number;
    acl_select?: 0 | 1;
    acl_insert?: 0 | 1;
    acl_update?: 0 | 1;
    acl_delete?: 0 | 1;
    id_type?: number;
    id_pageAccessTypes?: number;
    title?: string | null;
    children?: IPageItem[];
}

/**
 * Admin page details with additional metadata
 * Replaces IPageDetails from page-details.types.ts
 */
export interface IPageDetails extends IBasePageInfo {
    protocol?: string;
    headless?: boolean;
    action?: {
        id: number;
        typeCode: string;
        lookupCode: string;
        lookupValue: string;
        lookupDescription: string | null;
    };
    navigationSection?: any | null;
    parentPage?: any | null;
    pageType?: {
        id: number;
        name: string;
    };
    pageAccessType?: {
        id: number;
        typeCode: string;
        lookupCode: string;
        lookupValue: string;
        lookupDescription: string;
    };
    openAccess?: boolean;
}

// ==================== FIELD-SPECIFIC TYPES ====================

export interface IPageFieldTranslation {
    language_id: number;
    language_code: string;
    content: string;
}

export interface IPageField {
    id: number;
    name: string;
    title: string | null;
    type: string;
    default_value: string | null;
    help: string;
    display: boolean;
    translations: IPageFieldTranslation[];
    config?: IFieldConfig;
}

// ==================== PAGE CONTENT TYPES ====================

// Updated to match the actual API response structure
export interface IPageContent {
    id: number;
    keyword: string;
    url: string | null;
    parent_page_id: number | null;
    is_headless: boolean;
    nav_position: number | null;
    footer_position: number | null;
    sections: IPageSectionWithFields[];
}

/**
 * Interface matching the exact API response structure for page sections
 * Used for deserializing API responses directly
 */
export interface IApiSection {
    id: number;
    name: string;
    id_styles: number;
    style_name: string;
    condition: string | null;
    css: string | null;
    css_mobile: string | null;
    debug: number | null;
    data_config: string | number | null;
    can_have_children: number | null;
    position: number;
    level: number | { content: string; meta: string | null };
    path: string;
    children: IApiSection[];
    section_data: any[];
    fields: Record<string, IContentField<any>>;
    // Style-specific fields (conditional based on style_name)
    img_src?: IContentField<string>;
    alt?: IContentField<string>;
    title?: IContentField<string>;
    text?: IContentField<string>;
    is_paragraph?: IContentField<string>;
    url?: IContentField<string>;
    label?: IContentField<string>;
    type?: IContentField<string>;
    open_in_new_tab?: IContentField<string>;
    confirmation_title?: IContentField<string>;
    confirmation_continue?: IContentField<string>;
    confirmation_message?: IContentField<string>;
}

// ==================== RESPONSE DATA STRUCTURES ====================

export interface IPageFieldsData {
    page: IPageDetails;
    fields: IPageField[];
}

export interface IPageSectionsData {
    page_keyword: string;
    sections: IPageSectionWithFields[];
}

// ==================== UNIFIED RESPONSE TYPES ====================

/**
 * Consolidated page fields response
 * Uses IBaseApiResponse pattern for consistency
 */
export interface IPageFieldsResponse {
    status: number;
    message: string;
    error: null | string;
    logged_in: boolean;
    meta: {
        version: string;
        timestamp: string;
    };
    data: {
        sections: IPageSectionWithFields[];
        page_keyword: string;
    }
}

// Admin response types
export type TPageSectionsResponse = IBaseApiResponse<IPageSectionsData>;
export type TPageFieldsResponse = IBaseApiResponse<IPageFieldsData>;

// Frontend response types
export type TFrontendPagesResponse = IBaseApiResponse<IPageItem[]>;

/**
 * Response type for getting a single page with sections
 * Matches the actual API response structure
 */
export interface IGetPageResponse {
    status: number;
    message: string;
    error: null | string;
    logged_in: boolean;
    meta: {
        version: string;
        timestamp: string;
    };
    data: {
        page: IPageContent;
    };
}

export type TGetPageResponse = IGetPageResponse;

/** @deprecated Use IPageDetails.action instead */
export interface IPageAction {
    id: number;
    typeCode: string;
    lookupCode: string;
    lookupValue: string;
    lookupDescription: string | null;
}

/** @deprecated Use IPageDetails.pageType instead */
export interface IPageType {
    id: number;
    name: string;
}

/** @deprecated Use IPageDetails.pageAccessType instead */
export interface IPageAccessType {
    id: number;
    typeCode: string;
    lookupCode: string;
    lookupValue: string;
    lookupDescription: string;
}
