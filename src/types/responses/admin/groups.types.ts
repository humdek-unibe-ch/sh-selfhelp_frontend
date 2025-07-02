export interface IGroupDetails {
  id: number;
  name: string;
  description: string | null;
  id_group_types: number | null;
  requires_2fa: boolean;
  user_count: number;
  acls: IGroupAcl[];
}

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