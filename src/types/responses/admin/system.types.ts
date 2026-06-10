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

/**
 * How the backend runtime is deployed. `docker` = the production image
 * published by docker-release.yml (SELFHELP_DEPLOYMENT is baked into the
 * image); `source` = composer dev / bare checkout (the default).
 */
export type TSystemDeployment = 'docker' | 'source';

export interface ISystemVersion {
    instance_id: string;
    selfhelp_version: string;
    backend_version: string;
    frontend_version: string;
    plugin_api_version: string;
    database_migration_version: string;
    deployment: TSystemDeployment;
    safe_mode: boolean;
    maintenance_mode: boolean;
    installed_plugins: ISystemInstalledPlugin[];
}
export type ISystemVersionResponse = IBaseApiResponse<ISystemVersion>;

/** Overall verdict for the aggregated system health endpoint. */
export type TSystemHealthOverall = 'healthy' | 'degraded' | 'down';

/** Per-subsystem health status. `not_configured`/`unknown` are informational. */
export type TSystemComponentStatus =
    | 'ok'
    | 'down'
    | 'degraded'
    | 'configured'
    | 'not_configured'
    | 'unknown';

export interface ISystemHealthComponent {
    name: string;
    status: TSystemComponentStatus;
    detail: string;
}

/**
 * GET /admin/system/health — aggregated, instance-scoped health/status.
 * Never contains secrets: connection strings are reduced to configured/not.
 */
export interface ISystemHealth {
    instance_id: string;
    overall: TSystemHealthOverall;
    checked_at: string;
    safe_mode: boolean;
    maintenance_mode: boolean;
    version: {
        selfhelp: string;
        backend: string;
        frontend: string;
        plugin_api: string;
        database_migration: string;
    };
    update: {
        operation_id: string;
        status: string;
        progress_percent: number;
    };
    components: ISystemHealthComponent[];
}
export type ISystemHealthResponse = IBaseApiResponse<ISystemHealth>;

/** Advisory severity, matching the registry advisory feed. */
export type TSystemAdvisorySeverity = 'low' | 'medium' | 'high' | 'critical';

/** An installed component (core/frontend/plugin) an advisory affects. */
export interface ISystemAdvisoryAffected {
    kind: 'core' | 'frontend' | 'plugin';
    id: string;
    installed_version: string;
}

export interface ISystemAdvisory {
    id: string;
    severity: TSystemAdvisorySeverity;
    recommended_action: string;
    blocked: boolean;
    details_url: string | null;
    affected: ISystemAdvisoryAffected[];
    fixed_versions: string[];
}

/**
 * GET /admin/system/advisories — security advisories from the registry feed,
 * filtered to the components installed on THIS instance. `available: false`
 * means the registry could not be reached (the UI shows "could not check").
 */
export interface ISystemAdvisories {
    available: boolean;
    advisories: ISystemAdvisory[];
}
export type ISystemAdvisoriesResponse = IBaseApiResponse<ISystemAdvisories>;

/**
 * GET /admin/system/maintenance — current maintenance-mode state for THIS
 * instance. `forced_by_env` means the env hard switch
 * (SELFHELP_MAINTENANCE_MODE) is on and the CMS cannot disable it.
 */
export interface ISystemMaintenance {
    enabled: boolean;
    forced_by_env: boolean;
    message: string;
    since: string;
    updated_by: string;
    safe_mode: boolean;
}
export type ISystemMaintenanceResponse = IBaseApiResponse<ISystemMaintenance>;

/**
 * PUT /admin/system/maintenance — enable/disable maintenance for THIS instance.
 * No `instance_id`: the backend derives + verifies it server-side.
 */
export interface IMaintenanceSetRequest {
    enabled: boolean;
    message?: string;
}

export type TUpdatePreflightStatus = 'ok' | 'warning' | 'blocked';
export type TUpdateCheckSeverity = 'info' | 'warning' | 'error';

export interface IUpdatePreflightCheck {
    code: string;
    severity: TUpdateCheckSeverity;
    message: string;
    /**
     * Standardized compatibility-error fields (mirrors `@selfhelp/shared`
     * `IUpdatePreflightCheck` and the backend `CompatibilityError`). Populated by
     * version/compatibility checks (e.g. `plugin_compatibility`) so the admin sees
     * exactly which component blocks which target version and the range it
     * requires. Absent on non-compatibility checks.
     */
    component?: string;
    component_id?: string;
    current_version?: string;
    target_version?: string;
    required_range?: string;
    /** Whether this compatibility error blocks the update. */
    blocking?: boolean;
    /**
     * For `plugin_compatibility` checks: whether the blocking plugin is pinned and
     * must be unpinned (or removed) before it can be updated to a compatible
     * version.
     */
    pinned?: boolean;
}

/** One core version published in the official registry index. */
export interface IUpdateRelease {
    version: string;
    channel: 'stable' | 'beta' | 'nightly' | 'test';
    /** Whether the registry marks this release as blocked (e.g. by a security advisory). */
    blocked: boolean;
}

/**
 * GET /admin/system/update/releases — core versions published in the official
 * registry (newest first) for the "Request an update" version picker.
 * `available: false` means the registry could not be reached; the UI falls
 * back to manual version entry instead of blocking.
 */
export interface IUpdateReleases {
    available: boolean;
    current_version: string;
    releases: IUpdateRelease[];
}
export type IUpdateReleasesResponse = IBaseApiResponse<IUpdateReleases>;

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
 * Update operation lifecycle. `idle` is the synthetic state for an instance that
 * has never run an update (no operation row) — the backend returns it instead of
 * a misleading `succeeded`/100%. The CMS records `requested`; the SelfHelp
 * Manager writes the granular execution states back through the manager loop.
 * `approved` and `running` are kept as coarse legacy states for compatibility.
 */
export type TUpdateOperationStatus =
    | 'idle'
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
