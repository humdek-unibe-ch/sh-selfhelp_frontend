import { Meta } from "./response-envelope.types";

export interface ValidationErrorDetails {
    schema: string;
    errors: string[];
    missing_fields: string[];
    request_data?: Record<string, any>;
}

export interface BaseApiErrorResponse {
    status: number;
    message: string;
    error: string; // This is the primary error message string
    logged_in: boolean;
    meta: Meta; // Re-using Meta from BaseApiResponse
    data?: any; // "Additional error data, if any"
    validation?: ValidationErrorDetails;
}