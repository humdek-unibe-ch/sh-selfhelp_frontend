/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { IBaseApiResponse } from '../common/response-envelope.types';

export interface IScheduledJobTransaction {
    transaction_id: number;
    transaction_time: string;
    transaction_type: string;
    transaction_verbal_log: string;
    user: string;
}

export interface IScheduledJob {
    id: number;
    id_users: number;
    user_email: string;
    action_name: string | null;
    data_table_name: string | null;
    data_row: number | null;
    job_types: string;
    status: string;
    /** Stable lookup code for the status (e.g. `skipped_user_disabled_emails`). */
    status_code: string;
    /** Primary recipient email snapshot (issue #29), null for non-email jobs. */
    recipient_email: string | null;
    /** Linked user id for the primary recipient, null for external mailboxes. */
    recipient_user_id: number | null;
    /** True when the primary recipient is an external email with no SelfHelp user. */
    recipient_is_external: boolean;
    /** Delivery policy code (`respect_user_preferences` | `required_system`). */
    delivery_policy: string | null;
    description: string;
    user_timezone: string;
    date_scheduled: string;
    date_created: string;
    date_to_be_executed: string;
    date_executed: string | null;
    config: Record<string, any>;
    transactions?: IScheduledJobTransaction[];
}

export interface IScheduledJobsListData {
    scheduledJobs: IScheduledJob[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface IScheduledJobRecipient {
    id: number | null;
    channel: string;
    recipient_type: string;
    recipient_email: string | null;
    id_users: number | null;
    delivery_policy: string;
    resolved_from: string | null;
}

export interface IScheduledJobDetailData {
    id: number;
    status: {
        id: number;
        value: string;
        code: string;
    };
    job_type: {
        id: number;
        value: string;
        code: string;
    };
    description: string;
    date_create: string;
    date_to_be_executed: string;
    date_executed: string | null;
    config: string | null;
    recipients: IScheduledJobRecipient[];
    users: Array<{
        id: number;
        name: string;
        email: string;
    }>;
    tasks: Array<{
        id: number;
        name: string;
        description: string;
    }>;
    transactions: IScheduledJobTransaction[];
}

export interface IScheduledJobFilters {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    jobType?: string;
    dateFrom?: string;
    dateTo?: string;
    dateType?: 'date_create' | 'date_to_be_executed' | 'date_executed';
    sort?: 'id' | 'date_create' | 'date_to_be_executed' | 'date_executed' | 'description';
    sortDirection?: 'asc' | 'desc';
    includeTransactions?: boolean;
    userId?: number;
    actionId?: number;
}

export interface IScheduledJobStatus {
    id: number;
    value: string;
    description?: string;
}

export interface IRunnerSettings {
    enabled: boolean;
    interval_seconds: number;
    max_jobs_per_run: number | null;
    lock_ttl_seconds: number;
    stale_running_after_seconds: number;
}

export interface IRunnerLastRun {
    id: number | null;
    trigger_type: string;
    status: string;
    started_at: string;
    finished_at: string | null;
    duration_ms: number | null;
    due_count: number;
    attempted_count: number;
    done_count: number;
    failed_count: number;
    skipped_count: number;
    error_message: string | null;
}

export interface IRunnerStatus {
    settings: IRunnerSettings;
    last_run: IRunnerLastRun | null;
    queue: {
        due_queued_count: number;
        running_count: number;
        stale_running_count: number;
    };
    health: {
        next_eligible_run_at: string | null;
        scheduler_appears_stale: boolean;
        last_error_message: string | null;
    };
}

export interface IRunnerRunNow {
    run: {
        status: string;
        due_count: number;
        attempted_count: number;
        done_count: number;
        failed_count: number;
        skipped_count: number;
        lock_acquired: boolean;
        error_message: string | null;
        run_id: number | null;
    };
    status: IRunnerStatus;
}

/** Payload accepted by `PUT /admin/scheduled-jobs/runner/settings`. */
export interface IUpdateRunnerSettingsRequest {
    enabled?: boolean;
    interval_seconds?: number;
    max_jobs_per_run?: number | null;
    lock_ttl_seconds?: number;
    stale_running_after_seconds?: number;
}

export type TRunnerStatusResponse = IBaseApiResponse<IRunnerStatus>;
export type TRunnerRunNowResponse = IBaseApiResponse<IRunnerRunNow>;

export interface IScheduledJobType {
    type: string;
    description: string;
    handlerServiceId: string | null;
    pluginId: string | null;
    configSchemaPath: string | null;
}

export interface IScheduledJobTypeCatalog {
    types: IScheduledJobType[];
}

export type TScheduledJobTypesResponse = IBaseApiResponse<IScheduledJobTypeCatalog>;

export type TScheduledJobsListResponse = IBaseApiResponse<IScheduledJobsListData>;
export type TScheduledJobDetailResponse = IBaseApiResponse<IScheduledJobDetailData>;
export type TScheduledJobTransactionsResponse = IBaseApiResponse<IScheduledJobTransaction[]>;
export type TScheduledJobStatusesResponse = IBaseApiResponse<IScheduledJobStatus[]>;