import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import {
    IFormSubmitRequest,
    IFormUpdateRequest,
    IFormDeleteRequest
} from '../../types/requests/frontend/form-submission.types';
import {
    IFormSubmitResponse,
    IFormUpdateResponse,
    IFormDeleteResponse
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
    static async submitForm(data: IFormSubmitRequest | FormData): Promise<IFormSubmitResponse> {
        const config = data instanceof FormData ? {
            headers: { 'Content-Type': 'multipart/form-data' }
        } : undefined;
        
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.FORMS_SUBMIT, data, config);
        return response.data;
    }

    /**
     * Update existing form data (authenticated users)
     * Updates an existing form record based on criteria
     */
    static async updateForm(data: IFormUpdateRequest | FormData): Promise<IFormUpdateResponse> {
        const config = data instanceof FormData ? {
            headers: { 'Content-Type': 'multipart/form-data' }
        } : undefined;
        
        const response = await permissionAwareApiClient.put(API_CONFIG.ENDPOINTS.FORMS_UPDATE, data, config);
        return response.data;
    }

    /**
     * Delete form record
     * Removes a form record by ID
     */
    static async deleteForm(body: IFormDeleteRequest): Promise<IFormDeleteResponse> {
        // Backend now expects JSON body for DELETE
        const response = await permissionAwareApiClient.delete(API_CONFIG.ENDPOINTS.FORMS_DELETE, { data: body });
        return response.data;
    }

}
