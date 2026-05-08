/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface IDataTableSummary {
  id: number;
  name: string;
  displayName: string;
  created: string;
}

export interface IDataTablesListResponse {
  dataTables: IDataTableSummary[];
}

export interface IDataRowsResponse {
  rows: Array<Record<string, any>>;
}

export interface IDataTableColumnsResponse {
  columns: Array<{ id: number; name: string }>;
}

export interface IDataTableColumnNamesResponse {
  columnNames: string[];
}

export interface IDeleteColumnsRequest {
  columns: string[];
}

export interface IDeleteColumnsResponse {
  deleted_column_count: number;
}

export interface IDeleteRecordResponse {
  deleted: boolean;
}

export interface IDeleteTableResponse {
  deleted: boolean;
}





