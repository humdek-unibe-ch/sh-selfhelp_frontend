import { apiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import {
    IFormSubmitRequest,
    IFormUpdateRequest,
    IFormDeleteRequest,
    IGetPageFormsRequest
} from '../../types/requests/frontend/form-submission.types';
import {
    IFormSubmitResponse,
    IFormUpdateResponse,
    IFormDeleteResponse,
    IPageFormsResponse
} from '../../types/responses/frontend/form-submission.types';

/**
 * Form Submission API Service
 * Handles form data submission, updates, deletion, and retrieval
 */
export class FormSubmissionApi {
    /**
     * Submit form data (anonymous users)
     * Creates a new form record
     */
    static async submitForm(data: IFormSubmitRequest): Promise<IFormSubmitResponse> {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.FORMS_SUBMIT, data);
        return response.data;
    }

    /**
     * Update existing form data (authenticated users)
     * Updates an existing form record based on criteria
     */
    static async updateForm(data: IFormUpdateRequest): Promise<IFormUpdateResponse> {
        const response = await apiClient.put(API_CONFIG.ENDPOINTS.FORMS_UPDATE, data);
        return response.data;
    }

    /**
     * Delete form record
     * Removes a form record by ID
     */
    static async deleteForm(recordId: number): Promise<IFormDeleteResponse> {
        const response = await apiClient.delete(API_CONFIG.ENDPOINTS.FORMS_DELETE, {
            params: { record_id: recordId }
        });
        return response.data;
    }

    /**
     * Get all forms for a specific page
     * Retrieves form records associated with a page
     */
    static async getPageForms(pageId: number): Promise<IPageFormsResponse> {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.FORMS_GET_PAGE_FORMS, {
            params: { page_id: pageId }
        });
        return response.data;
    }
}
