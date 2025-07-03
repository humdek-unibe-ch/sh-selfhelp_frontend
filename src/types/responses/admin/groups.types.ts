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

// Legacy interface for backward compatibility
export interface IGroupAcl {
  id: number;
  name: string;
  description: string | null;
  resource: string;
  action: string;
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