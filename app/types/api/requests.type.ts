import { TStyle } from "./styles.types";

export interface IApiResponse<T> {
    status: number;
    message: string;
    error: string | null;
    data: T;
}

export interface IPageContent {
    content: (TStyle | null)[];
    title: string;
    description: string;
    is_headless: boolean;
}

export interface IAdminPage {
    id_pages: number;
    keyword: string;
    url: string;
    parent: number | null;
    nav_position: number | null;
    is_headless: number;
}

export interface IAdminAccess {
    access: boolean;
}