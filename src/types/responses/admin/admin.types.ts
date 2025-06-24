import { IBaseApiResponse } from '../common/response-envelope.types';
import { IPageField } from '../../common/pages.type';

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
    children?: IAdminPage[];
}

export type TAdminPageSectionsResponse = IBaseApiResponse<IAdminPageSectionsData>;

export interface ISectionField {
    id: number;
    name: string;
    type: string | null;
    default_value: string | null;
    help: string | null;
    disabled: boolean;
    hidden: number;
    display: boolean;
    translations: ISectionFieldTranslation[];
}

export interface ISectionFieldTranslation {
    language_id: number;
    language_code: string | null;
    gender_id: number;
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
}

export interface ISectionDetails {
    id: number;
    name: string;
    style: ISectionStyle;
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
