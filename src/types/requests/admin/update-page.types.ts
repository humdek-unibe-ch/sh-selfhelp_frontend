/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Request interface for updating an existing page
 * Based on backend API route: admin_update_page
 * Updated to match JSON schema validation requirements
 */
import { type IPageRouteItem } from '../../common/pages.type';

/**
 * Page data structure for updates
 */
export interface IUpdatePageData {
    /** URL path for the page */
    url?: string | null;
    
    /** HTTP methods supported by the page - pipe separated list */
    protocol?: string | null;
    
    /** Whether the page is headless */
    headless?: boolean;
    
    /** Whether the page has open access */
    openAccess?: boolean;
    
    /** Access type code from lookups with typeCode=pageAccessTypes */
    pageAccessTypeCode?: string;

    /**
     * CMS-in-CMS organization axis (issue #30): `public` | `cms` | null
     * (null resolves to public).
     */
    surface?: 'public' | 'cms' | null;

    /**
     * Full desired set of DB-driven public routes (issue #30). When present,
     * the backend syncs create/update/delete, validates global conflicts, and
     * enforces a single canonical route.
     */
    routes?: IPageRouteItem[];
    
    /** ID of the parent page */
    parent?: number | null;
}

/**
 * Field update structure - references common update_field.json schema
 */
export interface IUpdatePageField {
    /** ID of the field to update */
    fieldId: number;
    
    /** ID of the language for the field content */
    languageId: number;
    
    /** Content of the field */
    content: string | null;
}

/**
 * Main update page request structure
 */
export interface IUpdatePageRequest {
    /** Page data to update */
    pageData: IUpdatePageData;
    
    /** List of field translations to update */
    fields: IUpdatePageField[];
} 