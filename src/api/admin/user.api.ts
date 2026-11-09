/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import type {
  IUsersListResponse,
  IUsersListParams,
  IUserDetails,
  IUserGroup,
  IUserRole,
  IUsersStats,
  IBulkOperationResult,
  IUsersImportResult,
  ICleanUserDataResult
} from '../../types/responses/admin/users.types';
import type {
  ICreateUserRequest,
  IUpdateUserRequest,
  IToggleUserBlockRequest,
  IUserGroupsRequest,
  IUserRolesRequest,
  IBulkUserIdsRequest,
  IBulkGroupMembershipRequest,
  IImpersonateUserResponse,
  IStopImpersonateResponse
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
    if (params.status) searchParams.append('status', params.status);
    if (params.id_groups) searchParams.append('id_groups', params.id_groups.toString());
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.sortDirection) searchParams.append('sortDirection', params.sortDirection);

    const response = await permissionAwareApiClient.get<IBaseApiResponse<IUsersListResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_GET_ALL,
      { params: Object.fromEntries(searchParams) }
    );
    return response.data.data;
  },

  /**
   * Get the user counts backing the stat tiles.
   *
   * Scoped server-side to the users the caller can see, and deliberately
   * unfiltered: they describe that whole visible set, not the current
   * search/filter result, so the tiles stay stable while filtering.
   */
  async getUsersStats(): Promise<IUsersStats> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IUsersStats>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_STATS
    );
    return response.data.data;
  },

  /**
   * Delete one or more users. A single delete is a one-element array.
   */
  async bulkDeleteUsers(data: IBulkUserIdsRequest): Promise<IBulkOperationResult> {
    const response = await permissionAwareApiClient.post<IBaseApiResponse<IBulkOperationResult>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_BULK_DELETE,
      data
    );
    return response.data.data;
  },

  /**
   * Add one or more users to one or more groups.
   */
  async bulkAddUsersToGroup(data: IBulkGroupMembershipRequest): Promise<IBulkOperationResult> {
    const response = await permissionAwareApiClient.post<IBaseApiResponse<IBulkOperationResult>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_BULK_ADD_TO_GROUP,
      data
    );
    return response.data.data;
  },

  /**
   * Remove one or more users from one or more groups.
   */
  async bulkRemoveUsersFromGroup(
    data: IBulkGroupMembershipRequest
  ): Promise<IBulkOperationResult> {
    const response = await permissionAwareApiClient.post<IBaseApiResponse<IBulkOperationResult>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_BULK_REMOVE_FROM_GROUP,
      data
    );
    return response.data.data;
  },

  /**
   * Send activation mail to one or more users.
   */
  async bulkSendActivation(data: IBulkUserIdsRequest): Promise<IBulkOperationResult> {
    const response = await permissionAwareApiClient.post<IBaseApiResponse<IBulkOperationResult>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_BULK_SEND_ACTIVATION,
      data
    );
    return response.data.data;
  },

  /**
   * Export users as CSV, honouring the current filters. Returns the raw file
   * blob plus the server's filename — this endpoint is not JSON-enveloped.
   *
   * The backend names the file (`users_<timestamp>.csv`) and sends it in
   * `Content-Disposition`; we use that rather than inventing our own so the
   * export matches every other CSV the CMS produces.
   */
  async exportUsersCsv(
    params: IUsersListParams = {}
  ): Promise<{ blob: Blob; filename: string | null }> {
    const query: Record<string, string> = {};
    if (params.search) query['search'] = params.search;
    if (params.status) query['status'] = params.status;
    if (params.id_groups) query['id_groups'] = params.id_groups.toString();

    const response = await permissionAwareApiClient.get<Blob>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_EXPORT_CSV,
      { params: query, responseType: 'blob' }
    );

    const disposition = response.headers['content-disposition'];
    const match =
      typeof disposition === 'string'
        ? /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
        : null;

    return { blob: response.data, filename: match ? decodeURIComponent(match[1]) : null };
  },

  /**
   * Import users from a CSV file.
   */
  async importUsersCsv(file: File): Promise<IUsersImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await permissionAwareApiClient.post<IBaseApiResponse<IUsersImportResult>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_IMPORT_CSV,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
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
   * Erase everything a user produced, keeping the account itself.
   *
   * Core >=0.1.42 returns per-entity `removed` counts; anything older answered
   * a bare `{ cleaned: true }` from a stub that deleted nothing, which is why
   * `supports.core` is pinned to 0.1.42. The counts are optional here so a
   * missing body degrades to a generic success rather than a crash.
   */
  async cleanUserData(userId: number): Promise<ICleanUserDataResult> {
    const response = await permissionAwareApiClient.post<IBaseApiResponse<ICleanUserDataResult>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_CLEAN_DATA,
      undefined,
      userId
    );
    return { cleaned: true, removed: response.data?.data?.removed };
  },

  /**
   * Start an impersonation session.
   *
   * The BFF route `/api/admin/users/{id}/impersonate` strips the JWT from
   * the response body and writes it to an httpOnly cookie before this
   * call returns. The response we hand back to React contains only
   * non-secret fields (`target_email`, `expires_in`).
   */
  async impersonateUser(userId: number): Promise<IImpersonateUserResponse> {
    const response = await permissionAwareApiClient.post<IBaseApiResponse<{ target_email: string; expires_in: number }>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_IMPERSONATE,
      undefined,
      userId
    );

    const data = response.data.data;
    return {
      success: response.status === 200 || response.status === 204,
      target_email: data.target_email,
      expires_in: data.expires_in,
    };
  },

  /**
   * End the active impersonation session. The BFF clears both
   * impersonation cookies; Symfony blacklists the JWT so it cannot be
   * replayed even if it leaked.
   */
  async stopImpersonate(): Promise<IStopImpersonateResponse> {
    const response = await permissionAwareApiClient.post<IBaseApiResponse<{ stopped: boolean }>>(
      API_CONFIG.ENDPOINTS.ADMIN_USERS_STOP_IMPERSONATE,
      undefined
    );
    return {
      success: response.status === 200 || response.status === 204,
      stopped: !!response.data?.data?.stopped,
    };
  },
};
