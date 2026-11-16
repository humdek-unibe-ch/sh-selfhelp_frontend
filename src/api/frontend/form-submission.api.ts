/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import {
    type IFormSubmitRequest,
    type IFormUpdateRequest,
    type IFormDeleteRequest
,
    type IFormSubmitResponse,
    type IFormUpdateResponse,
    type IFormDeleteResponse
} from '../../shared';


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
        // FormData: leave Content-Type alone — `base.api` strips the default
        // `application/json` so the browser sets multipart + boundary (F173).
        const response = await permissionAwareApiClient.post<IFormSubmitResponse>(API_CONFIG.ENDPOINTS.FORMS_SUBMIT, data);
        return response.data;
    }

    /**
     * Update existing form data (authenticated users)
     * Updates an existing form record based on criteria
     */
    static async updateForm(data: IFormUpdateRequest | FormData): Promise<IFormUpdateResponse> {
        const response = await permissionAwareApiClient.put<IFormUpdateResponse>(API_CONFIG.ENDPOINTS.FORMS_UPDATE, data);
        return response.data;
    }

    /**
     * Delete form record
     * Removes a form record by ID
     */
    static async deleteForm(body: IFormDeleteRequest): Promise<IFormDeleteResponse> {
        // Backend now expects JSON body for DELETE
        const response = await permissionAwareApiClient.delete<IFormDeleteResponse>(API_CONFIG.ENDPOINTS.FORMS_DELETE, { data: body });
        return response.data;
    }

}
