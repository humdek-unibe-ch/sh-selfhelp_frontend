import { IBaseApiResponse } from '../common/response-envelope.types';

export interface ISectionItem {
    id: number;
    name: string;
    id_styles: number;
    style_name: string;
    position: number;
    can_have_children: boolean;
    level: number;
    path: string;
    children: ISectionItem[];
}

export interface IAdminPageSectionsData {
    page_keyword: string;
    sections: ISectionItem[];
}

export interface IAdminPage {
    id_pages: number;
    keyword: string;
    url: string;
    parent: number | null;
    nav_position: number | null;
    footer_position?: number | null;
    is_headless: number;
    children?: IAdminPage[];
}

export type TAdminPageSectionsResponse = IBaseApiResponse<IAdminPageSectionsData>;
