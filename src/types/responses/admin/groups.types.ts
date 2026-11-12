/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface IGroupDetails {
  id: number;
  name: string;
  description: string | null;
  /** A new public page gives this group `select`. */
  add_to_new_pages: boolean;
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
