import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';

// Removed unused exports - These interfaces are available internally
interface IPermission {
  id: number;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
  created_at?: string;
  updated_at?: string;
}

interface IPermissionsListResponse {
  permissions: IPermission[];
}

export const AdminPermissionApi = {
  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<IPermissionsListResponse> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IPermissionsListResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_PERMISSIONS_GET_ALL
    );
    return response.data.data;
  },
}; 