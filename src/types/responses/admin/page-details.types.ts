import { IBaseApiResponse } from '../common/response-envelope.types';

export interface IPageSection {
    id: number;
    name: string;
    id_styles: number;
    style_name: string;
    position: number;
    level: number;
    path: string;
    children: IPageSection[];
}

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
}

export interface IPageAction {
    id: number;
    typeCode: string;
    lookupCode: string;
    lookupValue: string;
    lookupDescription: string | null;
}

export interface IPageType {
    id: number;
    name: string;
}

export interface IPageAccessType {
    id: number;
    typeCode: string;
    lookupCode: string;
    lookupValue: string;
    lookupDescription: string;
}

export interface IPageDetails {
    id: number;
    keyword: string;
    url: string;
    protocol: string;
    action: IPageAction;
    navigationSection: any | null;
    parentPage: any | null;
    pageType: IPageType;
    pageAccessType: IPageAccessType;
    headless: boolean;
    navPosition: number | null;
    footerPosition: number | null;
    openAccess: boolean;
    system: boolean;
}

export interface IPageFieldsData {
    page: IPageDetails;
    fields: IPageField[];
}

export interface IPageSectionsData {
    page_keyword: string;
    sections: IPageSection[];
}

export type TPageSectionsResponse = IBaseApiResponse<IPageSectionsData>;
export type TPageFieldsResponse = IBaseApiResponse<IPageFieldsData>; 