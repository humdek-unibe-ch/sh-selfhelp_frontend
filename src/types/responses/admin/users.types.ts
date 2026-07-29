/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface IUserBasic {
  id: number;
  email: string;
  name: string | null;
  user_name: string | null;
  last_login: string | null;
  status: string;
  blocked: boolean;
  receives_notifications: boolean;
  receives_emails: boolean;
  code: string | null;
  validation_code: string | null;
  groups: string;
  roles: string;
  user_activity: number;
  user_type_code: string;
  user_type: string;
}

export interface IUserGroup {
  id: number;
  name: string;
  description: string | null;
}

export interface IUserRole {
  id: number;
  name: string;
  description: string | null;
}

export interface IUserDetails {
  id: number;
  email: string;
  name: string | null;
  user_name: string | null;
  code: string | null;
  validation_code: string | null;
  id_languages: number | null;
  id_userTypes: number | null;
  blocked: boolean;
  receives_notifications: boolean;
  receives_emails: boolean;
  status: string;
  groups: IUserGroup[];
  roles: IUserRole[];
  created_at: string;
  updated_at: string;
}

interface IUsersPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface IUsersListResponse {
  users: IUserBasic[];
  pagination: IUsersPagination;
}

/**
 * Status filter values. `all` is the UI default and is not sent to the API.
 *
 * These are the only values the backend accepts — anything else is a 400.
 * `blocked` is the `blocked` boolean, not a `userStatus` code; the schema has
 * no auth-lockout state, so blocking is the only lockout mechanism.
 */
export type TUserStatusFilter = 'all' | 'active' | 'invited' | 'imported' | 'blocked';

export interface IUsersListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  /** Omitted when 'all'. */
  status?: Exclude<TUserStatusFilter, 'all'>;
  /** Filter to members of this group. Omitted when no group is selected. */
  id_groups?: number;
  sort?: 'id' | 'email' | 'name' | 'user_name' | 'last_login' | 'blocked' | 'status' | 'user_type';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Counts for the Users page stat tiles.
 *
 * Scoped to the users the calling admin can see — the same visibility rules as
 * the list, so `total` always equals the unfiltered list's
 * `pagination.totalCount` for that admin. They ignore the active
 * search/status/group filters.
 *
 * These are five independent counts, NOT a breakdown that sums to `total`. The
 * `interested` and `auto_created` statuses count toward `total` but have no
 * tile; they are unused today, so the numbers happen to add up, but do not
 * present them as parts of a whole (stacked bar, % of total) — that would
 * silently under-report if those statuses are ever used.
 */
export interface IUsersStats {
  total: number;
  active: number;
  invited: number;
  imported: number;
  blocked: number;
}

/** Per-user outcome of a bulk operation, so partial failures can be reported. */
export interface IBulkOperationResult {
  succeeded: number[];
  failed: { id: number; reason: string }[];
}

/**
 * Outcome of a clean-user-data erasure.
 *
 * `removed` counts rows per entity. Entities the backend deliberately KEEPS
 * (e.g. the `DataAccessAudit` security trail) are ABSENT from the map rather
 * than reported as `0` — an absent key means "not in scope", where a `0` would
 * wrongly read as "there were none". Keys are therefore optional and the map is
 * treated as additive: a new backend key needs no frontend change.
 */
export interface ICleanUserDataResult {
  cleaned: boolean;
  removed?: Partial<Record<
    | 'scheduled_job_recipients'
    | 'scheduled_jobs'
    | 'data_cells'
    | 'data_rows'
    | 'transactions',
    number
  >>;
}

/**
 * Outcome of a CSV import. `errors` is row-addressed so the admin can fix the
 * source file rather than guessing which line was rejected.
 */
export interface IUsersImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}
