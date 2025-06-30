export interface ICreateUserRequest {
  email: string;
  name?: string;
  user_name?: string;
  password?: string;
  user_type_id?: number;
  blocked?: boolean;
  id_genders?: number;
  id_languages?: number;
  validation_code?: string;
  group_ids?: number[];
  role_ids?: number[];
}

export interface IUpdateUserRequest {
  email?: string;
  name?: string;
  user_name?: string;
  password?: string;
  user_type_id?: number;
  blocked?: boolean;
  id_genders?: number;
  id_languages?: number;
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