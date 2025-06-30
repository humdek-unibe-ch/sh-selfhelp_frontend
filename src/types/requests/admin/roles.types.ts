export interface ICreateRoleRequest {
  name: string;
  description?: string;
  permission_ids?: number[];
}

export interface IUpdateRoleRequest {
  name?: string;
  description?: string;
  permission_ids?: number[];
}

export interface IUpdateRolePermissionsRequest {
  permission_ids: number[];
}

export interface IAddPermissionsToRoleRequest {
  permission_ids: number[];
}

export interface IRemovePermissionsFromRoleRequest {
  permission_ids: number[];
} 