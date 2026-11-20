/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';

/** One permission of the list the role form's picker draws from; the two flags are set per signed-in person. */
export interface IPermission {
  id: number;
  name: string;
  description: string | null;
  /** The signed-in person holds this permission (or is the superuser): they may put it into a role. */
  can_assign: boolean;
  /** Name of the area's read permission that goes with this one, or `null` (a read right, a plugin permission). */
  implied_read: string | null;
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