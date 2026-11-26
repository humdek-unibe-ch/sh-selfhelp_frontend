/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface IRoleDetails {
  id: number;
  name: string;
  description: string | null;
  /** Full-access role; cannot be deleted; flag is not editable through the API. */
  is_superuser: boolean;
  permissions: IRolePermission[];
  users_count: number;
  permissions_count: number;
  /**
   * The signed-in person may change this role (rule 4.6f: every right in it is
   * one they hold, and they hold `admin.role.update`). Set by the server per
   * caller; the screen draws edit and the grant modals from it.
   */
  can_update: boolean;
  /**
   * The signed-in person may delete this role (rule 4.6f, `admin.role.delete`,
   * no users in it, not the full-access role). Set by the server per caller.
   */
  can_delete: boolean;
  /**
   * The signed-in person holds every right in this role (rule 4.6f), or is the
   * superuser. Set by the server per caller. The asset pickers offer a role
   * only when it is `true`; a role with `false` is shown disabled with a reason.
   */
  fully_held: boolean;
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
  id_resource_types: number;
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

/** A data-access resource type an enabled plugin adds (e.g. surveys). */
export interface IPluginResourceType {
  /** Id of the resourceTypes lookup row, sent as resource_type_id. */
  id: number;
  code: string;
  label: string;
  plugin_id: string;
}

/** One resource of a plugin resource type, listed by the plugin. */
export interface IPluginResource {
  id: number;
  name: string;
  description: string | null;
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