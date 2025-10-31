import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import type {
  IDataTablesListResponse,
  IDataRowsResponse,
  IDataTableColumnsResponse,
  IDataTableColumnNamesResponse,
  IDeleteColumnsRequest,
  IDeleteColumnsResponse,
  IDeleteRecordResponse,
  IDeleteTableResponse,
} from '../../types/responses/admin';

export const AdminDataApi = {
  async listDataTables(): Promise<IDataTablesListResponse> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IDataTablesListResponse>>(API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLES_LIST);
    return response.data.data;
  },

  async getDataRows(params: { table_name: string; user_id?: number; exclude_deleted?: boolean; language_id?: number }): Promise<IDataRowsResponse> {
    const queryParams: Record<string, string> = {
      table_name: params.table_name,
    };
    if (params.user_id !== undefined) queryParams.user_id = String(params.user_id);
    // Always request all rows and handle deleted visibility on client by hiding delete action when already deleted
    if (params.exclude_deleted !== undefined) queryParams.exclude_deleted = String(params.exclude_deleted);
    if (params.language_id !== undefined) queryParams.language_id = String(params.language_id);

    const response = await permissionAwareApiClient.get<IBaseApiResponse<IDataRowsResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_DATA_ROWS_GET,
      { params: queryParams }
    );
    return response.data.data;
  },

  async getTableColumns(tableName: string): Promise<IDataTableColumnsResponse> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IDataTableColumnsResponse>>(API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLE_COLUMNS_GET, tableName);
    return response.data.data;
  },

  async getTableColumnNames(tableName: string): Promise<IDataTableColumnNamesResponse> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IDataTableColumnNamesResponse>>(API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLE_COLUMN_NAMES_GET, tableName);
    return response.data.data;
  },

  async deleteColumns(tableName: string, body: IDeleteColumnsRequest): Promise<IDeleteColumnsResponse> {
    const response = await permissionAwareApiClient.delete<IBaseApiResponse<IDeleteColumnsResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLE_COLUMNS_DELETE,
      tableName,
      {
        data: body,
      }
    );
    return response.data.data;
  },

  async deleteRecord(recordId: number, opts?: { own_entries_only?: boolean }): Promise<IDeleteRecordResponse> {
    const params = opts?.own_entries_only === false ? { own_entries_only: 'false' } : undefined;
    const response = await permissionAwareApiClient.delete<IBaseApiResponse<IDeleteRecordResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_DATA_RECORD_DELETE,
      recordId,
      { params }
    );
    return response.data.data;
  },

  async deleteTable(tableName: string): Promise<IDeleteTableResponse> {
    const response = await permissionAwareApiClient.delete<IBaseApiResponse<IDeleteTableResponse>>(API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLE_DELETE, tableName);
    return response.data.data;
  },
};


