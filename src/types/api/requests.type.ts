import { Style } from "./styles.types";

export interface ApiResponse<T> {
    status: number;
    message: string;
    error: string | null;
    data: T;
}

export interface PageContent {
    content: (Style | null)[];
    title: string;
    description: string;
    is_headless: boolean;
}