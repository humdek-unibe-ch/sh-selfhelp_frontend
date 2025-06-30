import { apiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import type { 
  IRolesListResponse, 
  IRolesListParams, 
  IRoleDetails,
  IRolePermission
} from '../../types/responses/admin/roles.types';
import type {
  ICreateRoleRequest,
  IUpdateRoleRequest,
  IUpdateRolePermissionsRequest,
  IAddPermissionsToRoleRequest,
  IRemovePermissionsFromRoleRequest
} from '../../types/requests/admin/roles.types';

export const AdminRoleApi = {
  /**
   * Get paginated list of roles with search and sorting
   */
  async getRoles(params: IRolesListParams = {}): Promise<IRolesListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.sortDirection) searchParams.append('sortDirection', params.sortDirection);

    const url = `${API_CONFIG.ENDPOINTS.ADMIN_ROLES_GET_ALL}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await apiClient.get<IBaseApiResponse<IRolesListResponse>>(url);
    return response.data.data;
  },

  /**
   * Get single role details by ID
   */
  async getRoleById(roleId: number): Promise<IRoleDetails> {
    const response = await apiClient.get<IBaseApiResponse<IRoleDetails>>(API_CONFIG.ENDPOINTS.ADMIN_ROLES_GET_ONE(roleId));
    return response.data.data;
  },

  /**
   * Create a new role
   */
  async createRole(roleData: ICreateRoleRequest): Promise<IRoleDetails> {
    const response = await apiClient.post<IBaseApiResponse<IRoleDetails>>(API_CONFIG.ENDPOINTS.ADMIN_ROLES_CREATE, roleData);
    return response.data.data;
  },

  /**
   * Update existing role
   */
  async updateRole(roleId: number, roleData: IUpdateRoleRequest): Promise<IRoleDetails> {
    const response = await apiClient.put<IBaseApiResponse<IRoleDetails>>(API_CONFIG.ENDPOINTS.ADMIN_ROLES_UPDATE(roleId), roleData);
    return response.data.data;
  },

  /**
   * Delete role
   */
  async deleteRole(roleId: number): Promise<{ success: boolean }> {
    const response = await apiClient.delete(API_CONFIG.ENDPOINTS.ADMIN_ROLES_DELETE(roleId));
    return { success: response.status === 204 || response.status === 200 };
  },

  /**
   * Get role permissions
   */
  async getRolePermissions(roleId: number): Promise<IRolePermission[]> {
    const response = await apiClient.get<IBaseApiResponse<IRolePermission[]>>(API_CONFIG.ENDPOINTS.ADMIN_ROLES_PERMISSIONS_GET(roleId));
    return response.data.data;
  },

  /**
   * Add permissions to role
   */
  async addPermissionsToRole(roleId: number, data: IAddPermissionsToRoleRequest): Promise<IRolePermission[]> {
    const response = await apiClient.post<IBaseApiResponse<IRolePermission[]>>(API_CONFIG.ENDPOINTS.ADMIN_ROLES_PERMISSIONS_ADD(roleId), data);
    return response.data.data;
  },

  /**
   * Remove permissions from role
   */
  async removePermissionsFromRole(roleId: number, data: IRemovePermissionsFromRoleRequest): Promise<{ success: boolean }> {
    const response = await apiClient.delete(API_CONFIG.ENDPOINTS.ADMIN_ROLES_PERMISSIONS_REMOVE(roleId), { data });
    return { success: response.status === 204 || response.status === 200 };
  },

  /**
   * Update role permissions (bulk replace)
   */
  async updateRolePermissions(roleId: number, data: IUpdateRolePermissionsRequest): Promise<IRolePermission[]> {
    const response = await apiClient.put<IBaseApiResponse<IRolePermission[]>>(API_CONFIG.ENDPOINTS.ADMIN_ROLES_PERMISSIONS_UPDATE(roleId), data);
    return response.data.data;
  }
}; 