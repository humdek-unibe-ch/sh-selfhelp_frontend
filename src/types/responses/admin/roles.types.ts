export interface IRoleDetails {
  id: number;
  name: string;
  description: string | null;
  permissions: IRolePermission[];
  users_count: number;
  permissions_count: number;
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
  roles: IRoleDetails[];
  pagination: IRolesPagination;
}

export interface IRolesListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: 'name' | 'description' | 'permissions_count' | 'users_count' | 'created_at' | 'updated_at';
  sortDirection?: 'asc' | 'desc';
}

// Data Access Management Types
export interface IRolePermissionDetails {
  resource_type_id: number;
  resource_type_name: string;
  resource_id: number;
  crud_permissions: number; // Bitwise permission flags
  created_at: string;
  updated_at: string;
}

export interface IRoleDataAccessPermissions {
  role_id: number;
  role_name: string;
  role_description: string | null;
  permissions: IRolePermissionDetails[];
}

export interface IRoleEffectivePermissionDetails {
  id_roles: number;
  role_name: string;
  id_resourceTypes: number;
  resource_id: number;
  resource_type_name: string;
  unified_permissions: number;
  individual_permissions: string;
}

export interface IRoleEffectivePermissions {
  role_id: number;
  users_with_role: number;
  effective_permissions: IRoleEffectivePermissionDetails[];
}

export interface ICreateDataAccessPermissionRequest {
  resource_type_id: number;
  resource_id: number;
  crud_permissions: number; // Bitwise permission flags
}

export interface IUpdateDataAccessPermissionRequest {
  crud_permissions: number; // Bitwise permission flags
}

export interface ICreateDataAccessPermissionResponse {
  id: number;
  idRoles: number;
  idResourceTypes: number;
  resourceId: number;
  crudPermissions: number;
  createdAt: string;
  updatedAt: string;
  role: {
    id: number;
    name: string;
    description: string | null;
  };
  resourceType: {
    id: number;
    lookupCode: string;
    lookupValue: string;
    typeCode: string;
  };
}

export interface IUpdateDataAccessPermissionResponse {
  id: number;
  idRoles: number;
  idResourceTypes: number;
  resourceId: number;
  crudPermissions: number;
  createdAt: string;
  updatedAt: string;
  role: {
    id: number;
    name: string;
    description: string | null;
  };
  resourceType: {
    id: number;
    lookupCode: string;
    lookupValue: string;
    typeCode: string;
  };
}

export interface ISetRolePermissionsRequest {
  permissions: Array<{
    resource_type_id: number;
    resource_id: number;
    crud_permissions: number;
  }>;
}

export interface ISetRolePermissionsResponse {
  role_id: number;
  message: string;
  changes: {
    added: number;
    updated: number;
    removed: number;
    total: number;
  };
} 