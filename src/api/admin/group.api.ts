import { apiClient } from '../base.api';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import type { 
  IGroupsListResponse, 
  IGroupsListParams, 
  IGroupDetails,
  IGroupAcl
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

    const url = `/admin/groups${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await apiClient.get<IBaseApiResponse<IGroupsListResponse>>(url);
    return response.data.data;
  },

  /**
   * Get all groups (without pagination) for dropdowns
   */
  async getAllGroups(): Promise<IGroupDetails[]> {
    const response = await apiClient.get<IBaseApiResponse<IGroupDetails[]>>('/admin/groups/all');
    return response.data.data;
  },

  /**
   * Get single group details by ID
   */
  async getGroupById(groupId: number): Promise<IGroupDetails> {
    const response = await apiClient.get<IBaseApiResponse<IGroupDetails>>(`/admin/groups/${groupId}`);
    return response.data.data;
  },

  /**
   * Create a new group
   */
  async createGroup(groupData: ICreateGroupRequest): Promise<IGroupDetails> {
    const response = await apiClient.post<IBaseApiResponse<IGroupDetails>>('/admin/groups', groupData);
    return response.data.data;
  },

  /**
   * Update existing group
   */
  async updateGroup(groupId: number, groupData: IUpdateGroupRequest): Promise<IGroupDetails> {
    const response = await apiClient.put<IBaseApiResponse<IGroupDetails>>(`/admin/groups/${groupId}`, groupData);
    return response.data.data;
  },

  /**
   * Delete group
   */
  async deleteGroup(groupId: number): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/admin/groups/${groupId}`);
    return { success: response.status === 204 || response.status === 200 };
  },

  /**
   * Get group ACLs
   */
  async getGroupAcls(groupId: number): Promise<IGroupAcl[]> {
    const response = await apiClient.get<IBaseApiResponse<IGroupAcl[]>>(`/admin/groups/${groupId}/acls`);
    return response.data.data;
  },

  /**
   * Update group ACLs
   */
  async updateGroupAcls(groupId: number, data: IUpdateGroupAclsRequest): Promise<IGroupAcl[]> {
    const response = await apiClient.put<IBaseApiResponse<IGroupAcl[]>>(`/admin/groups/${groupId}/acls`, data);
    return response.data.data;
  }
}; 