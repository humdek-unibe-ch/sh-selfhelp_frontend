import { permissionAwareApiClient } from '../base.api';
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

    const response = await permissionAwareApiClient.get<IBaseApiResponse<IUsersListResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_GET_ALL,
      { params: Object.fromEntries(searchParams) }
    );
    return response.data.data;
  },

  /**
   * Get single user details by ID
   */
  async getUserById(userId: number): Promise<IUserDetails> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IUserDetails>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_GET_ONE,
      userId
    );
    return response.data.data;
  },

  /**
   * Create a new user
   */
  async createUser(userData: ICreateUserRequest): Promise<IUserDetails> {
    const response = await permissionAwareApiClient.post<IBaseApiResponse<IUserDetails>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_CREATE,
      userData
    );
    return response.data.data;
  },

  /**
   * Update existing user
   */
  async updateUser(userId: number, userData: IUpdateUserRequest): Promise<IUserDetails> {
    const response = await permissionAwareApiClient.put<IBaseApiResponse<IUserDetails>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_UPDATE,
      userData,
      userId
    );
    return response.data.data;
  },

  /**
   * Delete user
   */
  async deleteUser(userId: number): Promise<{ success: boolean }> {
    const response = await permissionAwareApiClient.delete(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_DELETE,
      userId
    );
    return { success: response.status === 204 || response.status === 200 };
  },

  /**
   * Block or unblock user
   */
  async toggleUserBlock(userId: number, data: IToggleUserBlockRequest): Promise<IUserDetails> {
    const response = await permissionAwareApiClient.patch<IBaseApiResponse<IUserDetails>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_BLOCK,
      data,
      userId
    );
    return response.data.data;
  },

  /**
   * Get user groups
   */
  async getUserGroups(userId: number): Promise<IUserGroup[]> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IUserGroup[]>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_GROUPS_GET,
      userId
    );
    return response.data.data;
  },

  /**
   * Add groups to user
   */
  async addGroupsToUser(userId: number, data: IUserGroupsRequest): Promise<IUserGroup[]> {
    const response = await permissionAwareApiClient.post<IBaseApiResponse<IUserGroup[]>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_GROUPS_ADD,
      data,
      userId
    );
    return response.data.data;
  },

  /**
   * Remove groups from user
   */
  async removeGroupsFromUser(userId: number, data: IUserGroupsRequest): Promise<{ success: boolean }> {
    const response = await permissionAwareApiClient.delete(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_GROUPS_REMOVE,
      userId,
      { data }
    );
    return { success: response.status === 204 || response.status === 200 };
  },

  /**
   * Get user roles
   */
  async getUserRoles(userId: number): Promise<IUserRole[]> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IUserRole[]>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_ROLES_GET,
      userId
    );
    return response.data.data;
  },

  /**
   * Add roles to user
   */
  async addRolesToUser(userId: number, data: IUserRolesRequest): Promise<IUserRole[]> {
    const response = await permissionAwareApiClient.post<IBaseApiResponse<IUserRole[]>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_ROLES_ADD,
      data,
      userId
    );
    return response.data.data;
  },

  /**
   * Remove roles from user
   */
  async removeRolesFromUser(userId: number, data: IUserRolesRequest): Promise<{ success: boolean }> {
    const response = await permissionAwareApiClient.delete(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_ROLES_REMOVE,
      userId,
      { data }
    );
    return { success: response.status === 204 || response.status === 200 };
  },

  /**
   * Send activation mail to user
   */
  async sendActivationMail(userId: number): Promise<{ success: boolean }> {
    const response = await permissionAwareApiClient.post(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_SEND_ACTIVATION,
      undefined,
      userId
    );
    return { success: response.status === 204 || response.status === 200 };
  },

  /**
   * Clean user data
   */
  async cleanUserData(userId: number): Promise<{ success: boolean }> {
    const response = await permissionAwareApiClient.post(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_CLEAN_DATA,
      undefined,
      userId
    );
    return { success: response.status === 204 || response.status === 200 };
  },

  /**
   * Impersonate user
   */
  async impersonateUser(userId: number): Promise<{ success: boolean }> {
    const response = await permissionAwareApiClient.post(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_IMPERSONATE,
      undefined,
      userId
    );
    return { success: response.status === 204 || response.status === 200 };
  }
}; 