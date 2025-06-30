export interface IUserBasic {
  id: number;
  email: string;
  name: string | null;
  last_login: string | null;
  status: string;
  blocked: boolean;
  code: string | null;
  groups: string;
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
  id_genders: number | null;
  id_languages: number | null;
  id_userTypes: number | null;
  blocked: boolean;
  groups: IUserGroup[];
  roles: IUserRole[];
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
  sort?: 'email' | 'name' | 'last_login' | 'blocked' | 'user_type';
  sortDirection?: 'asc' | 'desc';
} 