import { apiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';

export interface IGender {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface IGendersListResponse {
  genders: IGender[];
}

export const AdminGenderApi = {
  /**
   * Get all genders
   */
  async getGenders(): Promise<IGendersListResponse> {
    const response = await apiClient.get<IBaseApiResponse<IGendersListResponse>>(API_CONFIG.ENDPOINTS.ADMIN_GENDERS_GET_ALL);
    return response.data.data;
  },
}; 