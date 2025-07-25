import { apiClient } from './base.api';
import { API_CONFIG } from '../config/api.config';
import {
    TUserInputListResponse,
    TUserInputDeleteResponse,
    IUserInputFilters
} from '../types/responses/admin/user-input.types';

export class UserInputApi {
    /**
     * Get user input entries with filtering and pagination
     */
    static async getUserInputEntries(filters: IUserInputFilters = {}): Promise<TUserInputListResponse> {
        const params = new URLSearchParams();
        
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.form_name) params.append('form_name', filters.form_name);
        if (filters.user_id) params.append('user_id', filters.user_id.toString());
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);

        const queryString = params.toString();
        const url = queryString ? `${API_CONFIG.ENDPOINTS.USER_INPUT_GET_ALL}?${queryString}` : API_CONFIG.ENDPOINTS.USER_INPUT_GET_ALL;
        
        const response = await apiClient.get(url);
        return response.data;
    }

    /**
     * Delete a user input entry
     */
    static async deleteUserInputEntry(entryId: number): Promise<TUserInputDeleteResponse> {
        const response = await apiClient.delete(API_CONFIG.ENDPOINTS.USER_INPUT_DELETE(entryId));
        return response.data;
    }
} 