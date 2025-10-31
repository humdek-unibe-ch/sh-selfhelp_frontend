import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import type { 
  IGroupsListResponse, 
  IGroupsListParams, 
  IGroupDetails,
  IGroupAcl,
  IGroupPageAcl
} from '../../types/responses/admin/groups.types';
import type {
  ICreateGroupRequest,
  IUpdateGroupRequest,
  IUpdateGroupAclsRequest
} from '../../types/requests/admin/groups.types';

export const AdminGroupApi = {
  /**
   * Get paginated list of groups with search and sorting
   */
  async getGroups(params: IGroupsListParams = {}): Promise<IGroupsListResponse> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.sortDirection) searchParams.append('sortDirection', params.sortDirection);

    const response = await permissionAwareApiClient.get<IBaseApiResponse<IGroupsListResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_GROUPS_GET_ALL,
      { params: Object.fromEntries(searchParams) }
    );
    return response.data.data;
  },

  /**
   * Get single group details by ID
   */
  async getGroupById(groupId: number): Promise<IGroupDetails> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IGroupDetails>>(
      API_CONFIG.ENDPOINTS.ADMIN_GROUPS_GET_ONE,
      groupId
    );
    return response.data.data;
  },

  /**
   * Create a new group
   */
  async createGroup(groupData: ICreateGroupRequest): Promise<IGroupDetails> {
    const response = await permissionAwareApiClient.post<IBaseApiResponse<IGroupDetails>>(
      API_CONFIG.ENDPOINTS.ADMIN_GROUPS_CREATE,
      groupData
    );
    return response.data.data;
  },

  /**
   * Update existing group
   */
  async updateGroup(groupId: number, groupData: IUpdateGroupRequest): Promise<IGroupDetails> {
    const response = await permissionAwareApiClient.put<IBaseApiResponse<IGroupDetails>>(
      API_CONFIG.ENDPOINTS.ADMIN_GROUPS_UPDATE,
      groupData,
      groupId
    );
    return response.data.data;
  },

  /**
   * Delete group
   */
  async deleteGroup(groupId: number): Promise<{ success: boolean }> {
    const response = await permissionAwareApiClient.delete(
      API_CONFIG.ENDPOINTS.ADMIN_GROUPS_DELETE,
      groupId
    );
    return { success: response.status === 204 || response.status === 200 };
  },

  /**
   * Get group ACLs (page-based)
   */
  async getGroupAcls(groupId: number): Promise<IGroupPageAcl[]> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IGroupPageAcl[]>>(
      API_CONFIG.ENDPOINTS.ADMIN_GROUPS_ACLS_GET,
      groupId
    );
    return response.data.data;
  },

  /**
   * Update group ACLs (page-based)
   */
  async updateGroupAcls(groupId: number, data: IUpdateGroupAclsRequest): Promise<IGroupPageAcl[]> {
    const response = await permissionAwareApiClient.put<IBaseApiResponse<IGroupPageAcl[]>>(
      API_CONFIG.ENDPOINTS.ADMIN_GROUPS_ACLS_UPDATE,
      data,
      groupId
    );
    return response.data.data;
  }
}; 