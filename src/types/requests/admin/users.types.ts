export interface ICreateUserRequest {
  email: string;
  name?: string;
  user_name: string;
  validation_code: string;
  password?: string;
  id_languages?: number;
  id_userTypes?: number;
  blocked?: boolean;
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
