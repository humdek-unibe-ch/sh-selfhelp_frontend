/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface IGroupDetails {
  id: number;
  name: string;
  description: string | null;
  id_group_types: number | null;
  requires_2fa: boolean;
  users_count: number;
  acls: IGroupPageAcl[];
}

export interface IGroupPageAcl {
  page_id: number;
  page_keyword: string;
  page_title: string | null;
  page_type: number;
  is_system: boolean;
  is_configuration: boolean;
  acl_select: boolean;
  acl_insert: boolean;
  acl_update: boolean;
  acl_delete: boolean;
}

/** Access level a group holds on an asset folder. `manage` implies `read`. */
export type TAssetFolderAccessLevel = 'read' | 'manage';

/** One folder grant held by a group (as returned by GET group asset-acls). */
export interface IGroupAssetAcl {
  folder: string;
  access_level: TAssetFolderAccessLevel;
}

/** GET /admin/groups/{id}/asset-acls response `data`. */
export interface IGroupAssetAclsResponse {
  acls: IGroupAssetAcl[];
}

export interface IGroupsPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface IGroupsListResponse {
  groups: IGroupDetails[];
  pagination: IGroupsPagination;
}

export interface IGroupsListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: 'name' | 'description' | 'members_count' | 'created_at' | 'updated_at';
  sortDirection?: 'asc' | 'desc';
}

/** A user who belongs to a group, as listed by "View members". Shared with
 *  roles via `IMemberUser` — same shape from every `.../users` endpoint. */
export type { IMemberUser as IGroupMember } from './admin.types';
