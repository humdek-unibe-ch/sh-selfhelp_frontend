/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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