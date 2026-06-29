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
  rows: Array<Record<string, unknown>>;
}

/**
 * A data-table column. `fieldKey` is the immutable storage key
 * (`data_cols.field_key`); `displayName` is the mutable human label
 * (`data_cols.display_name`, null when never curated). Treat `fieldKey`
 * as an opaque literal everywhere — it may contain dots (e.g. survey
 * panel keys) and must never be parsed as a nested path.
 */
export interface IDataTableColumn {
  id: number;
  fieldKey: string | null;
  displayName: string | null;
}

export interface IDataTableColumnsResponse {
  columns: IDataTableColumn[];
}

export interface IDataTableColumnNamesResponse {
  /** Immutable field keys (data_cols.field_key) for the table. */
  columnNames: string[];
}

export interface IDeleteColumnsRequest {
  /** Immutable field keys of the columns to delete. */
  columns: string[];
}

/** Curate a column's human label without changing its storage key. */
export interface IUpdateColumnDisplayNameRequest {
  /** Immutable storage key of the column (data_cols.field_key). */
  fieldKey: string;
  /** New label; null/empty clears it (falls back to the field key). */
  displayName: string | null;
}

export interface IUpdateColumnDisplayNameResponse {
  updated: boolean;
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

export type TDataExportFormat = 'csv' | 'json';

export interface IDataExportFilters {
  user_id?: number;
  language_id?: number;
  exclude_deleted?: boolean;
}

export interface IDataExportTableParams extends IDataExportFilters {
  format: TDataExportFormat;
}

export interface IBulkDataExportRequest extends IDataExportFilters {
  table_names: string[];
  format: TDataExportFormat;
}





