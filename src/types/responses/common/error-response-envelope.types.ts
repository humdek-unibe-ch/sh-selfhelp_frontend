import { IMeta } from "./response-envelope.types";

export interface IValidationErrorDetails {
    schema: string;
    errors: string[];
    missing_fields: string[];
    request_data?: Record<string, any>;
}

export interface IBaseApiErrorResponse {
    status: number;
    message: string;
    error: string; // This is the primary error message string
    logged_in: boolean;
    meta: IMeta; // Re-using Meta from BaseApiResponse
    data?: any; // "Additional error data, if any"
    validation?: IValidationErrorDetails;
}