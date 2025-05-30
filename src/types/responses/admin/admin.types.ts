import { IBaseApiResponse } from '../common/response-envelope.types';

export interface ISectionItem {
    id: number;
    name: string;
    id_styles: number;
    style_name: string;
    position: number;
    level: number;
    path: string;
    children: ISectionItem[];
}

export interface IAdminPageSectionsData {
    page_keyword: string;
    sections: ISectionItem[];
}

export type TAdminPageSectionsResponse = IBaseApiResponse<IAdminPageSectionsData>;
