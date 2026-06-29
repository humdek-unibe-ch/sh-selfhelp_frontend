/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { type IBaseApiResponse } from '../common/response-envelope.types';
import { type IPageField } from '../../common/pages.type';
import { type IFieldConfig } from '../../requests/admin/fields.types';

export interface IAdminPageSectionsData {
    page_keyword: string;
    sections: IPageField[];
}

export interface IAdminPage {
    id_pages: number;
    keyword: string;
    url: string;
    id_parent_page: number | null;
    nav_position: number | null;
    footer_position: number | null;
    is_headless: boolean;
    is_open_access: boolean;
    id_page_access_types: number;
    id_page_types: number;
    is_system: boolean;
    crud: number;
}

export type TAdminPageSectionsResponse = IBaseApiResponse<IAdminPageSectionsData>;

export interface ISectionField {
    id: number;
    name: string;
    /**
     * Backend-derived field scope (mobile rendering plan, section 6.4): `content`
     * (translatable copy, display=1), `common` (unprefixed behavior/data +
     * portable presentation property, display=0), `web`/`mobile` (prefixed
     * platform-only presentation properties). The CMS section inspector groups
     * fields by this value and must not re-derive it from the field name or
     * display flag. Optional only to tolerate cached responses; treated as a
     * contract error when absent in dev/tests.
     */
    scope?: 'content' | 'common' | 'web' | 'mobile';
    type: string | null;
    default_value: string | null;
    title: string | null;
    help: string | null;
    disabled: boolean;
    hidden: number;
    display: boolean;
    translations: ISectionFieldTranslation[];
    config?: IFieldConfig;
}

export interface ISectionFieldTranslation {
    language_id: number;
    language_code: string | null;
    content: string | null;
    meta: string | null | object;
}

export interface ISectionStyle {
    id: number;
    name: string;
    description: string;
    typeId: number;
    type: string;
    canHaveChildren: boolean;
    relationships?: {
        allowedChildren: Array<{
            id: number;
            name: string;
        }>;
        allowedParents: Array<{
            id: number;
            name: string;
        }>;
    };
}

export interface ISectionGlobalFields {
    condition: string | null;
    data_config: string | null;
    css: string | null;
    css_mobile: string | null;
    debug: boolean;
}

export interface ISectionDetails {
    id: number;
    name: string;
    style: ISectionStyle;
    global_fields: ISectionGlobalFields;
}

/**
 * Underlying data table of a form section (issue #56). Present only for form
 * sections so the inspector can show where submissions are stored, flag an
 * admin-locked label, and deep link to the Data browser. `name` is the immutable
 * storage name (== form section id) used as the deep-link target.
 */
export interface ISectionDataTableInfo {
    id: number;
    name: string;
    display_name: string | null;
    locked: boolean;
}

export interface ISectionDetailsData {
    section: ISectionDetails;
    fields: ISectionField[];
    data_table?: ISectionDataTableInfo;
}

export type TSectionDetailsResponse = IBaseApiResponse<ISectionDetailsData>;

export interface IPageHierarchy {
    id: number;
    keyword: string;
    label: string;
    link: string;
    hasChildren: boolean;
    children: IPageHierarchy[];
    level: number;
    nav_position: number | null;
    is_system: boolean;
    is_headless: boolean;
}
