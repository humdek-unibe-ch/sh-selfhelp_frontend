export interface IFieldConfig {
    multiSelect?: boolean;
    creatable?: boolean;
    separator?: string;
    options?: Array<{
        value: string;
        text: string;
    }>;
    apiUrl?: string;
}

export interface ISelectOption {
    value: string;
    text: string;
}

export interface ISelectOptionsResponse {
    status: number;
    message: string;
    error: string | null;
    logged_in: boolean;
    meta: {
        version: string;
        timestamp: string;
    };
    data: {
        options: ISelectOption[];
    };
}

export interface ICssClassOption {
    value: string;
    text: string;
}

export interface ICssClassesResponse {
    status: number;
    message: string;
    error: string | null;
    logged_in: boolean;
    meta: {
        version: string;
        timestamp: string;
    };
    data: {
        classes: ICssClassOption[];
    };
} 