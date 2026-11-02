/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface ICreateUserRequest {
  email: string;
  name?: string;
  user_name: string;
  validation_code: string;
  password?: string;
  id_languages?: number;
  id_userTypes?: number;
  blocked?: boolean;
  receives_notifications?: boolean;
  receives_emails?: boolean;
  group_ids?: number[];
  role_ids?: number[];
}

export interface IUpdateUserRequest {
  email?: string;
  name?: string;
  user_name?: string;
  password?: string;
  id_languages?: number;
  id_userTypes?: number;
  blocked?: boolean;
  receives_notifications?: boolean;
  receives_emails?: boolean;
  group_ids?: number[];
  role_ids?: number[];
}

export interface IToggleUserBlockRequest {
  blocked: boolean;
}

export interface IUserGroupsRequest {
  group_ids: number[];
}

export interface IUserRolesRequest {
  role_ids: number[];
}

/**
 * Bulk requests. Each takes an explicit `user_ids` list and supports a single
 * id as a one-element array, so the UI has one code path for "act on the
 * selection" whether that selection is 1 user or 50.
 */
export interface IBulkUserIdsRequest {
  user_ids: number[];
}

/** Shared by bulk add-to-group and bulk remove-from-group — same payload,
 *  opposite direction. */
export interface IBulkGroupMembershipRequest extends IBulkUserIdsRequest {
  group_ids: number[];
}

/**
 * Returned by `POST /api/admin/users/{id}/impersonate` (BFF) — strictly
 * non-secret. The BFF strips the impersonation JWT from the upstream
 * response body and parks it in an httpOnly cookie before resolving the
 * promise; this type is what the React layer is allowed to see.
 */
export interface IImpersonateUserResponse {
  success: boolean;
  target_email: string;
  expires_in: number;
}

export interface IStopImpersonateResponse {
  success: boolean;
  stopped: boolean;
}
