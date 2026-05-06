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
    IPageItem,
    IPageSectionWithFields,
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
    navigationSection?: any | null;
    parentPage?: any | null;
    pageType?: {
        id: number;
        name: string;
    };
    pageAccessType?: IPageAccessTypeInfo;
    openAccess?: boolean;
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
    translations: import('../../shared').IPageFieldTranslation[];
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
    section_data: any[];
    fields: Record<string, IContentField<any>>;
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
