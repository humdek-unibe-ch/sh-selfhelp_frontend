import { BaseApiResponse } from '../common/response-envelope.types';

export interface SectionItem {
    id: number;
    name: string;
    id_styles: number;
    style_name: string;
    position: number;
    level: number;
    path: string;
    children: SectionItem[];
}

export interface AdminPageSectionsData {
    page_keyword: string;
    sections: SectionItem[];
}

export type AdminPageSectionsResponse = BaseApiResponse<AdminPageSectionsData>;
