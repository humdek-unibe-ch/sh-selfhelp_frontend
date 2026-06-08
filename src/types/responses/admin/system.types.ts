/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * System maintenance / update contracts (instance-scoped).
 *
 * These MIRROR `@selfhelp/shared`'s `src/types/api/system.ts` (shared >= 1.4.0)
 * and the backend JSON schemas under
 * `config/schemas/api/v1/{responses,requests}/admin/`. They live in-tree only
 * because the published `@selfhelp/shared` consumed here is still < 1.4.0; once
 * the new shared version is published + installed, delete this file and import
 * `ISystemVersion` / `IUpdatePreflight` / `IUpdateStatus` / `IUpdateRequest`
 * from `@selfhelp/shared` (see `src/shared/index.ts`). Schema parity is enforced
 * by the shared `check:schemas` script against the backend schemas.
 *
 * Hard rule: the browser NEVER sends an `instance_id` for update execution; the
 * backend derives + verifies it. That is why {@link IUpdateRequest} has no
 * `instance_id` field.
 */
import { IBaseApiResponse } from '../common/response-envelope.types';

export interface ISystemInstalledPlugin {
    id: string;
    version: string;
    compatible: boolean;
}

export interface ISystemVersion {
    instance_id: string;
    selfhelp_version: string;
    backend_version: string;
    frontend_version: string;
    plugin_api_version: string;
    database_migration_version: string;
    safe_mode: boolean;
    maintenance_mode: boolean;
    installed_plugins: ISystemInstalledPlugin[];
}
export type ISystemVersionResponse = IBaseApiResponse<ISystemVersion>;

export type TUpdatePreflightStatus = 'ok' | 'warning' | 'blocked';
export type TUpdateCheckSeverity = 'info' | 'warning' | 'error';

export interface IUpdatePreflightCheck {
    code: string;
    severity: TUpdateCheckSeverity;
    message: string;
}

export interface IUpdatePreflightOption {
    type: string;
    version?: string;
    label: string;
}

export interface IUpdatePreflight {
    preflight_id: string;
    status: TUpdatePreflightStatus;
    instance_id: string;
    current_version: string;
    target_version: string;
    checks: IUpdatePreflightCheck[];
    options: IUpdatePreflightOption[];
    database: {
        destructive: boolean;
        requires_backup: boolean;
        manual_confirmation_required: boolean;
    };
    rollback: {
        automatic_before_migrations: boolean;
        automatic_after_destructive_migrations: boolean;
    };
}
export type IUpdatePreflightResponse = IBaseApiResponse<IUpdatePreflight>;

export interface IUpdateRequest {
    target_version: string;
    preflight_id: string;
    accepted_migration_risk: boolean;
    typed_confirmation?: string;
}

/**
 * Update operation lifecycle. The CMS records `requested`; the SelfHelp Manager
 * writes the granular execution states back through the manager loop. `approved`
 * and `running` are kept as coarse legacy states for backward compatibility.
 */
export type TUpdateOperationStatus =
    | 'requested'
    | 'approved'
    | 'accepted'
    | 'running'
    | 'preflight_running'
    | 'preflight_failed'
    | 'backup_running'
    | 'update_running'
    | 'migration_running'
    | 'health_check_running'
    | 'succeeded'
    | 'failed'
    | 'rollback_running'
    | 'rolled_back'
    | 'rollback_failed'
    | 'rejected';

export interface IUpdateStep {
    name: string;
    status: string;
    detail?: string;
}

export interface IUpdateStatus {
    instance_id: string;
    operation_id: string;
    status: TUpdateOperationStatus;
    target_version: string;
    progress_percent: number;
    steps: IUpdateStep[];
    requested_at: string;
    updated_at: string;
    message?: string;
}
export type IUpdateStatusResponse = IBaseApiResponse<IUpdateStatus>;

export type IUpdateRequestResponse = IBaseApiResponse<{
    operation_id: string;
    instance_id: string;
    status: TUpdateOperationStatus;
}>;
