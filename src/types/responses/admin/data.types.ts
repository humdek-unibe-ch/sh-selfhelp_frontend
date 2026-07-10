/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface IDataTableSummary {
  id: number;
  name: string;
  displayName: string;
  /**
   * True when an admin manually renamed the table's label in the Data browser
   * (provenance `manual`); the owning form section's `displayName` field no
   * longer overwrites it on save (issue #56).
   */
  locked: boolean;
  created: string;
}

export interface IDataTablesListResponse {
  dataTables: IDataTableSummary[];
}

export interface IDataRowsResponse {
  rows: Array<Record<string, unknown>>;
  /** Optional server-side code-to-label maps for option-bearing form fields. */
  optionLabelMaps?: Record<string, Record<string, string>>;
}

/**
 * A data-table column. `fieldKey` is the immutable storage key
 * (`data_cols.field_key`); `displayName` is the mutable human label
 * (`data_cols.display_name`, null when never curated). Treat `fieldKey`
 * as an opaque literal everywhere — it may contain dots (e.g. survey
 * panel keys) and must never be parsed as a nested path.
 */
export interface IDataTableColumn {
  /** Real `data_cols.id` for dynamic columns; null for standard projection columns. */
  id: number | null;
  fieldKey: string | null;
  displayName: string | null;
  /**
   * True when the label was manually curated (provenance `manual`); automatic
   * label pushes from form-input renames / submissions no longer overwrite it.
   * Use "Reset to auto" to clear the lock (issue #56).
   */
  locked: boolean;
  /**
   * True for the always-present projection columns every row implicitly carries
   * (`record_id`, `id_users`, `user_name`, `user_code`, `entry_date`,
   * `triggerType`). They are offered in the data-config builder / SQL filter but
   * are read-only in the Data browser — no `id`, and cannot be renamed or
   * deleted (issue #56).
   */
  standard?: boolean;
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

/**
 * Curate a whole data table's human label and lock it so the owning form
 * section stops overwriting it; null/empty resets to the auto label derived
 * from the form section (issue #56).
 */
export interface IUpdateTableDisplayNameRequest {
  /** New label; null/empty resets the table to the auto (form-section) label. */
  displayName: string | null;
}

export interface IUpdateTableDisplayNameResponse {
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





