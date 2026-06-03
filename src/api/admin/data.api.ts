/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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
  IDataExportTableParams,
  IBulkDataExportRequest,
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

  async deleteRecord(recordId: number, tableName: string, opts?: { own_entries_only?: boolean }): Promise<IDeleteRecordResponse> {
    const params: Record<string, string> = { table_name: tableName };
    if (opts?.own_entries_only === false) params.own_entries_only = 'false';
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

  async exportTable(tableName: string, params: IDataExportTableParams): Promise<Blob> {
    const queryParams: Record<string, string> = { format: params.format };
    if (params.user_id !== undefined) queryParams.user_id = String(params.user_id);
    if (params.language_id !== undefined) queryParams.language_id = String(params.language_id);
    if (params.exclude_deleted !== undefined) queryParams.exclude_deleted = String(params.exclude_deleted);

    const response = await permissionAwareApiClient.get<Blob>(
      API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLE_EXPORT,
      tableName,
      { params: queryParams, responseType: 'blob' }
    );
    return response.data;
  },

  async exportTablesZip(body: IBulkDataExportRequest): Promise<Blob> {
    const response = await permissionAwareApiClient.post<Blob>(
      API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLES_EXPORT_BULK,
      body,
      // `params: {}` ensures the wrapper detects this as an Axios config and
      // not a route param (the bulk route is static and takes none).
      { params: {}, responseType: 'blob' }
    );
    return response.data;
  },
};


