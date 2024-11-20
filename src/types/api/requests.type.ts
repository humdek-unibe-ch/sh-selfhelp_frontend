import { Style } from "./styles.types";

export interface IApiResponse<T> {
    status: number;
    message: string;
    error: string | null;
    data: T;
}

export interface IPageContent {
    content: (Style | null)[];
    title: string;
    description: string;
    is_headless: boolean;
}