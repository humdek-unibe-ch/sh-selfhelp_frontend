export interface IUserBasic {
  id: number;
  email: string;
  name: string | null;
  user_name: string | null;
  last_login: string | null;
  status: string;
  blocked: boolean;
  code: string | null;
  validation_code: string | null;
  groups: string;
  roles: string;
  user_activity: number;
  user_type_code: string;
  user_type: string;
}

export interface IUserGroup {
  id: number;
  name: string;
  description: string | null;
}

export interface IUserRole {
  id: number;
  name: string;
  description: string | null;
}

export interface IUserDetails {
  id: number;
  email: string;
  name: string | null;
  user_name: string | null;
  code: string | null;
  validation_code: string | null;
  id_genders: number | null;
  id_languages: number | null;
  id_userTypes: number | null;
  blocked: boolean;
  status: string;
  groups: IUserGroup[];
  roles: IUserRole[];
  created_at: string;
  updated_at: string;
}

export interface IUsersPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface IUsersListResponse {
  users: IUserBasic[];
  pagination: IUsersPagination;
}

export interface IUsersListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: 'id' | 'email' | 'name' | 'user_name' | 'last_login' | 'blocked' | 'status' | 'user_type';
  sortDirection?: 'asc' | 'desc';
} 