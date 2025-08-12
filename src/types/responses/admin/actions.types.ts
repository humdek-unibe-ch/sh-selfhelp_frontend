export interface IActionDetails {
  id: number;
  name: string;
  // Backend returns nested objects for trigger type and data table in list/details
  action_trigger_type?: {
    id: number;
    type_code: string;
    lookup_code: string;
    lookup_value: string;
  };
  data_table?: {
    id: number;
    name: string;
    displayName: string;
  };
  id_actionTriggerTypes?: number | string; // for compatibility when posting/putting
  id_dataTables?: number | null;           // for compatibility when posting/putting
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


