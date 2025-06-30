export interface IRoleBasic {
  id: number;
  name: string;
  description: string | null;
  permissions_count: number;
  users_count: number;
  created_at: string;
  updated_at: string;
}

export interface IRoleDetails {
  id: number;
  name: string;
  description: string | null;
  permissions: IRolePermission[];
  users_count: number;
  created_at: string;
  updated_at: string;
}

export interface IRolePermission {
  id: number;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

export interface IRolesPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface IRolesListResponse {
  roles: IRoleBasic[];
  pagination: IRolesPagination;
}

export interface IRolesListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: 'name' | 'description' | 'permissions_count' | 'users_count' | 'created_at' | 'updated_at';
  sortDirection?: 'asc' | 'desc';
} 