import { TStyle } from '../../common/styles.types';
import { IBaseApiResponse } from '../common/response-envelope.types';

export interface IPageItem {
    id_users: number;
    id_pages: number;
    acl_select: 0 | 1;
    acl_insert: 0 | 1;
    acl_update: 0 | 1;
    acl_delete: 0 | 1;
    keyword: string;
    url: string;
    protocol: string;
    id_actions: number;
    id_navigation_section: number | null;
    parent: number | null;
    is_headless: 0 | 1;
    nav_position: number | null;
    footer_position: number | null;
    id_type: number;
    id_pageAccessTypes: number;
    children: IPageItem[];
}

export interface IPageContent {
    content: (TStyle | null)[];
    title: string;
    description: string;
    is_headless: boolean;
}

// Removed IFrontendPagesData; API returns data as IPageItem[]
export type TFrontendPagesResponse = IBaseApiResponse<IPageItem[]>;
