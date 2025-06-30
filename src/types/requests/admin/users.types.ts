export interface ICreateUserRequest {
  email: string;
  name?: string;
  user_name: string;
  password?: string;
  id_genders?: number;
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
  id_genders?: number;
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