import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import { IActionDetails, IActionsListParams, IActionsListResponse } from '../../types/responses/admin';
import { ICreateActionRequest, IUpdateActionRequest } from '../../types/requests/admin/actions.types';

export const AdminActionApi = {
  async getActions(params: IActionsListParams = {}): Promise<IActionsListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', String(params.page));
    if (params.pageSize) searchParams.append('pageSize', String(params.pageSize));
    if (params.search) searchParams.append('search', params.search);
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.sortDirection) searchParams.append('sortDirection', params.sortDirection);

    const response = await permissionAwareApiClient.get<IBaseApiResponse<IActionsListResponse>>(API_CONFIG.ENDPOINTS.ADMIN_ACTIONS_GET_ALL, { params: Object.fromEntries(searchParams) });
    return response.data.data;
  },

  async getActionById(actionId: number): Promise<IActionDetails> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IActionDetails>>(API_CONFIG.ENDPOINTS.ADMIN_ACTIONS_GET_ONE, actionId);
    return response.data.data as any; // backend returns same nested structure as list
  },

  async createAction(payload: ICreateActionRequest): Promise<IActionDetails> {
    const response = await permissionAwareApiClient.post<IBaseApiResponse<IActionDetails>>(API_CONFIG.ENDPOINTS.ADMIN_ACTIONS_CREATE, payload);
    return response.data.data;
  },

  async updateAction(actionId: number, payload: IUpdateActionRequest): Promise<IActionDetails> {
    const response = await permissionAwareApiClient.put<IBaseApiResponse<IActionDetails>>(API_CONFIG.ENDPOINTS.ADMIN_ACTIONS_UPDATE, payload, actionId);
    return response.data.data;
  },

  async deleteAction(actionId: number): Promise<{ success: boolean }> {
    const response = await permissionAwareApiClient.delete(API_CONFIG.ENDPOINTS.ADMIN_ACTIONS_DELETE, actionId);
    return { success: response.status === 204 || response.status === 200 };
  },
};


