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
    children?: IAdminPage[];
}

export type TAdminPageSectionsResponse = IBaseApiResponse<IAdminPageSectionsData>;
