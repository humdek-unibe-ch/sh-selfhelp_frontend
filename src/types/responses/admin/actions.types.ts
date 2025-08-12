export interface IActionDetails {
  id: number;
  name: string;
  id_actionTriggerTypes: number | string; // backend may return id or code
  id_dataTables?: number | null;
  config: any | null; // JSON schema-based config
  created_at?: string;
  updated_at?: string;
}

export interface IActionsPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface IActionsListResponse {
  actions: IActionDetails[];
  pagination: IActionsPagination;
}

export interface IActionsListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: 'name' | 'created_at' | 'updated_at';
  sortDirection?: 'asc' | 'desc';
}


