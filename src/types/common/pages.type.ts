/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Page type shim.
 *
 * User-facing page contracts are sourced from `sh-selfhelp_shared` and consumed
 * by both the web frontend and the mobile app. This file keeps legacy frontend
 * imports stable and only defines CMS-admin-only additions locally.
 */

import type {
    IBaseApiResponse,
    IBasePageInfo,
    IContentField,
    IGetPageResponse,
    IPageAccessTypeInfo,
    IPageFieldTranslation,
    IPageItem,
    IPageSectionsData,
} from '../../shared';
import type { IFieldConfig } from '../requests/admin/fields.types';

export type {
    IBasePageInfo,
    IBasePageSection,
    IGetPageResponse,
    IPageAccessTypeInfo,
    IPageContent,
    IPageItem,
    IPageSectionWithFields,
    IPageSectionsData,
    IPageFieldTranslation,
} from '../../shared';

/**
 * Admin page details with additional metadata.
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
    navigationSection?: unknown | null;
    parentPage?: unknown | null;
    pageType?: {
        id: number;
        name: string;
    };
    /**
     * The page access target (`pageAccessTypes` lookup: `web` | `mobile` |
     * `mobile_and_web`) is the single page-level platform model. It controls
     * where the page may load and which styles the add-section picker offers.
     * There is no separate page `platform` field (the experimental duplicate was
     * removed); render target is a style-level concept only.
     */
    pageAccessType?: IPageAccessTypeInfo;
    openAccess?: boolean;
    /**
     * CMS-in-CMS organization axis (issue #30) lookup code: `public` | `cms`
     * (null/absent resolves to `public`). The full lookup object is in
     * `pageSurface`; `surface` is the convenience code editors round-trip.
     */
    surface?: 'public' | 'cms' | null;
    pageSurface?: {
        id: number;
        typeCode: string;
        lookupCode: string;
        lookupValue: string;
        lookupDescription: string | null;
    } | null;
}

/**
 * One DB-driven public route for a page (issue #30). Round-trips between the
 * admin page-fields GET response (`routes`) and the page update request
 * (`pageData.routes`). Param names inside `path_pattern` and `requirements`
 * keys are snake_case and are never remapped.
 */
export interface IPageRouteItem {
    /** Existing `page_routes` id; absent/null for a new, unsaved route. */
    id?: number | null;
    /** Symfony route pattern, e.g. `/team` or `/team/{record_id}`. */
    path_pattern: string;
    /** Placeholder name -> regex requirement map (e.g. `{ record_id: '\\d+' }`). */
    requirements?: Record<string, string> | null;
    is_canonical: boolean;
    is_active: boolean;
    priority: number;
}

/**
 * Admin field metadata. `config` remains frontend-admin specific because it
 * carries editor configuration that the mobile app does not render.
 */
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

/**
 * Raw admin API section shape before the page renderer normalizes it.
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
    section_data: unknown[];
    fields: Record<string, IContentField<unknown>>;
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

export interface IPageFieldsData {
    page: IPageDetails;
    fields: IPageField[];
    /** DB-driven public routes for this page (issue #30); edited in the Routes panel. */
    routes?: IPageRouteItem[];
}

export interface IPageFieldsResponse {
    status: number;
    message: string;
    error: null | string;
    logged_in: boolean;
    meta: {
        version: string;
        timestamp: string;
    };
    data: IPageSectionsData;
}

export type TPageSectionsResponse = IBaseApiResponse<IPageSectionsData>;
export type TPageFieldsResponse = IBaseApiResponse<IPageFieldsData>;
export type TFrontendPagesResponse = IBaseApiResponse<IPageItem[]>;
export type TGetPageResponse = IGetPageResponse;
