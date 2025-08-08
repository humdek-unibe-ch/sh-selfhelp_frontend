import { apiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import type {
  IDataTablesListResponse,
  IDataRowsResponse,
  IDataTableColumnsResponse,
  IDeleteColumnsRequest,
  IDeleteColumnsResponse,
  IDeleteRecordResponse,
  IDeleteTableResponse,
} from '../../types/responses/admin';

export const AdminDataApi = {
  async listDataTables(): Promise<IDataTablesListResponse> {
    const response = await apiClient.get<IBaseApiResponse<IDataTablesListResponse>>(API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLES_LIST);
    return response.data.data;
  },

  async getDataRows(params: { table_name: string; user_id?: number; exclude_deleted?: boolean }): Promise<IDataRowsResponse> {
    const search = new URLSearchParams();
    search.append('table_name', params.table_name);
    if (params.user_id !== undefined) search.append('user_id', String(params.user_id));
    // Always request all rows and handle deleted visibility on client by hiding delete action when already deleted
    if (params.exclude_deleted !== undefined) search.append('exclude_deleted', String(params.exclude_deleted));
    const url = `${API_CONFIG.ENDPOINTS.ADMIN_DATA_ROWS_GET}?${search.toString()}`;
    const response = await apiClient.get<IBaseApiResponse<IDataRowsResponse>>(url);
    return response.data.data;
  },

  async getTableColumns(tableName: string): Promise<IDataTableColumnsResponse> {
    const response = await apiClient.get<IBaseApiResponse<IDataTableColumnsResponse>>(API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLE_COLUMNS_GET(tableName));
    return response.data.data;
  },

  async deleteColumns(tableName: string, body: IDeleteColumnsRequest): Promise<IDeleteColumnsResponse> {
    const response = await apiClient.delete<IBaseApiResponse<IDeleteColumnsResponse>>(API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLE_COLUMNS_DELETE(tableName), {
      data: body,
    });
    return response.data.data;
  },

  async deleteRecord(recordId: number, opts?: { own_entries_only?: boolean }): Promise<IDeleteRecordResponse> {
    const url = `${API_CONFIG.ENDPOINTS.ADMIN_DATA_RECORD_DELETE(recordId)}${opts?.own_entries_only === false ? '?own_entries_only=false' : ''}`;
    const response = await apiClient.delete<IBaseApiResponse<IDeleteRecordResponse>>(url);
    return response.data.data;
  },

  async deleteTable(tableName: string): Promise<IDeleteTableResponse> {
    const response = await apiClient.delete<IBaseApiResponse<IDeleteTableResponse>>(API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLE_DELETE(tableName));
    return response.data.data;
  },
};


