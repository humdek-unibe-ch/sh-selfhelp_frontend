import { IBaseApiResponse } from '../common/response-envelope.types';
import { IPageField } from '../../common/pages.type';
import { IFieldConfig } from '../../requests/admin/fields.types';

export interface IAdminPageSectionsData {
    page_keyword: string;
    sections: IPageField[];
}

export interface IAdminPage {
    id_pages: number;
    keyword: string;
    url: string;
    parent: number | null;
    nav_position: number | null;
    footer_position?: number | null;
    is_headless: number;
    is_system: number;
    id_type?: number;
    title: string | null;
    children?: IAdminPage[];
}

export type TAdminPageSectionsResponse = IBaseApiResponse<IAdminPageSectionsData>;

export interface ISectionField {
    id: number;
    name: string;
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

export interface ISectionDetailsData {
    section: ISectionDetails;
    fields: ISectionField[];
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
    is_system: number;
    is_headless: number;
}
