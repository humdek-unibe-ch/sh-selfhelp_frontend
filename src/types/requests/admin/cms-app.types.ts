/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

/**
 * FE request/result DTOs for CMS apps. Contract response shapes live in
 * `@selfhelp/shared` (`ICmsApp`, `ICmsAppPage`, `TCmsAppRole`).
 */

import type { TCmsAppRole } from '@selfhelp/shared';

export {
    CMS_APP_PRIMARY_ROLES,
    CMS_APP_ROLES,
    type ICmsApp,
    type ICmsAppDetail,
    type ICmsAppPage,
    type ICmsAppAssignedPage,
    type ICmsAppSummary,
    type TCmsAppRole,
} from '@selfhelp/shared';

export interface ICreateCmsAppShellRequest {
    name: string;
    slug: string;
    description?: string | null;
}

export interface IUpdateCmsAppRequest {
    name?: string;
    slug?: string;
    description?: string | null;
}

export interface IAssignCmsAppPageRequest {
    page_id: number;
    role: TCmsAppRole;
}

export interface IChangeCmsAppPageRoleRequest {
    role: TCmsAppRole;
}

/** Scaffold payload for POST /admin/cms-apps/{id}/scaffold */
export type TCmsAppFormFieldStyle =
    | 'text-input'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'number-input';

export interface ICmsAppFormField {
    name: string;
    style: TCmsAppFormFieldStyle;
    label?: string;
}

export interface IScaffoldCmsAppRequest {
    base_name?: string;
    data_table?: string;
    create_form?: boolean;
    form_field_name?: string;
    form_field_label?: string;
    form_fields?: ICmsAppFormField[];
    create_public?: boolean;
    create_admin?: boolean;
    record_id_param?: string;
    list_title?: string;
    detail_title?: string;
    access_groups?: number[];
}

export interface IScaffoldCmsAppResult {
    app_id: number;
    created: Array<{
        keyword: string;
        page_id: number;
        surface: string;
        role: TCmsAppRole;
    }>;
}
