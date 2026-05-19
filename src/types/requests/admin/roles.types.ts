/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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