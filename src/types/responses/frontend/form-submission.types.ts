/**
 * Form submission response types for frontend form handling
 */

// Base form response structure
export interface IFormResponse<T = any> {
    status: number;
    message?: string;
    data?: T;
    error?: string;
}

// Form submission response
export interface IFormSubmitResponse extends IFormResponse {
    data?: {
        record_id: number;
        success: boolean;
        message?: string;
    };
}

// Form update response
export interface IFormUpdateResponse extends IFormResponse {
    data?: {
        record_id: number;
        success: boolean;
        updated_fields?: string[];
        message?: string;
    };
}

// Form deletion response
export interface IFormDeleteResponse extends IFormResponse {
    data?: {
        success: boolean;
        message?: string;
    };
}

// Page forms response
export interface IPageFormsResponse extends IFormResponse {
    data?: {
        forms: IFormRecord[];
        total_count: number;
    };
}

// Form record structure
export interface IFormRecord {
    id: number;
    page_id: number;
    form_id: string;
    form_data: Record<string, any>;
    created_at: string;
    updated_at?: string;
    user_id?: number;
}
