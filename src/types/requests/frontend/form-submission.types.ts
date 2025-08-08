/**
 * Form submission request and response types for frontend form handling
 */

// Form submission request (anonymous users)
export interface IFormSubmitRequest {
    page_id: number;
    section_id: number;
    form_data: Record<string, any>;
}

// Form update request (authenticated users)
export interface IFormUpdateRequest {
    page_id: number;
    section_id: number;
    form_data: Record<string, any>;
    update_based_on?: Record<string, any>;
}

// Form deletion request
export interface IFormDeleteRequest {
    record_id: number;
    page_id: number;
    section_id: number;
}

// Removed: page forms request (no longer used)
