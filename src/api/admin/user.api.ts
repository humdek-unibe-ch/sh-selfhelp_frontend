import { apiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import type { 
  IUsersListResponse, 
  IUsersListParams, 
  IUserDetails,
  IUserGroup,
  IUserRole
} from '../../types/responses/admin/users.types';
import type {
  ICreateUserRequest,
  IUpdateUserRequest,
  IToggleUserBlockRequest,
  IUserGroupsRequest,
  IUserRolesRequest
} from '../../types/requests/admin/users.types';

export const AdminUserApi = {
  /**
   * Get paginated list of users with search and sorting
   */
  async getUsers(params: IUsersListParams = {}): Promise<IUsersListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.sortDirection) searchParams.append('sortDirection', params.sortDirection);

    const url = `/admin/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await apiClient.get<IBaseApiResponse<IUsersListResponse>>(url);
    return response.data.data;
  },

  /**
   * Get single user details by ID
   */
  async getUserById(userId: number): Promise<IUserDetails> {
    const response = await apiClient.get<IBaseApiResponse<IUserDetails>>(`/admin/users/${userId}`);
    return response.data.data;
  },

  /**
   * Create a new user
   */
  async createUser(userData: ICreateUserRequest): Promise<IUserDetails> {
    const response = await apiClient.post<IBaseApiResponse<IUserDetails>>('/admin/users', userData);
    return response.data.data;
  },

  /**
   * Update existing user
   */
  async updateUser(userId: number, userData: IUpdateUserRequest): Promise<IUserDetails> {
    const response = await apiClient.put<IBaseApiResponse<IUserDetails>>(`/admin/users/${userId}`, userData);
    return response.data.data;
  },

  /**
   * Delete user
   */
  async deleteUser(userId: number): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/admin/users/${userId}`);
    return { success: response.status === 204 || response.status === 200 };
  },

  /**
   * Block or unblock user
   */
  async toggleUserBlock(userId: number, data: IToggleUserBlockRequest): Promise<IUserDetails> {
    const response = await apiClient.patch<IBaseApiResponse<IUserDetails>>(`/admin/users/${userId}/block`, data);
    return response.data.data;
  },

  /**
   * Get user groups
   */
  async getUserGroups(userId: number): Promise<IUserGroup[]> {
    const response = await apiClient.get<IBaseApiResponse<IUserGroup[]>>(`/admin/users/${userId}/groups`);
    return response.data.data;
  },

  /**
   * Add groups to user
   */
  async addGroupsToUser(userId: number, data: IUserGroupsRequest): Promise<IUserGroup[]> {
    const response = await apiClient.post<IBaseApiResponse<IUserGroup[]>>(`/admin/users/${userId}/groups`, data);
    return response.data.data;
  },

  /**
   * Remove groups from user
   */
  async removeGroupsFromUser(userId: number, data: IUserGroupsRequest): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/admin/users/${userId}/groups`, { data });
    return { success: response.status === 204 || response.status === 200 };
  },

  /**
   * Get user roles
   */
  async getUserRoles(userId: number): Promise<IUserRole[]> {
    const response = await apiClient.get<IBaseApiResponse<IUserRole[]>>(`/admin/users/${userId}/roles`);
    return response.data.data;
  },

  /**
   * Add roles to user
   */
  async addRolesToUser(userId: number, data: IUserRolesRequest): Promise<IUserRole[]> {
    const response = await apiClient.post<IBaseApiResponse<IUserRole[]>>(`/admin/users/${userId}/roles`, data);
    return response.data.data;
  },

  /**
   * Remove roles from user
   */
  async removeRolesFromUser(userId: number, data: IUserRolesRequest): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/admin/users/${userId}/roles`, { data });
    return { success: response.status === 204 || response.status === 200 };
  },

  /**
   * Send activation mail to user
   */
  async sendActivationMail(userId: number): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/admin/users/${userId}/send-activation-mail`);
    return { success: response.status === 204 || response.status === 200 };
  },

  /**
   * Clean user data
   */
  async cleanUserData(userId: number): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/admin/users/${userId}/clean-data`);
    return { success: response.status === 204 || response.status === 200 };
  },

  /**
   * Impersonate user
   */
  async impersonateUser(userId: number): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/admin/users/${userId}/impersonate`);
    return { success: response.status === 204 || response.status === 200 };
  }
}; 