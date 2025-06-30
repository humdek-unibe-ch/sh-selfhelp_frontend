import { apiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';

export interface IPermission {
  id: number;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IPermissionsListResponse {
  permissions: IPermission[];
}

export const AdminPermissionApi = {
  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<IPermissionsListResponse> {
    const response = await apiClient.get<IBaseApiResponse<IPermissionsListResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_PERMISSIONS_GET_ALL
    );
    return response.data.data;
  },
}; 