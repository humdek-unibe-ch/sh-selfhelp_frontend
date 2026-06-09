/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Type definitions for the admin plugin manager responses. Mirrors the
 * response envelopes emitted by `App\Controller\Api\V1\Admin\Plugin\*`.
 *
 * Keep field names in sync with `PluginAdminService::formatPlugin()` /
 * `formatOperation()` / `formatSource()` / `formatFeatureFlag()` on
 * the backend.
 */

export interface IAdminPluginCompatibility {
    severity: 'ok' | 'warning' | 'blocking';
    reasons: string[];
    coreRange?: string;
    sdkRange?: string;
    detectedCore: string;
    detectedSdk: string;
}

/**
 * Update available for an installed plugin. Mirrors a single row of
 * `listAvailableUpdates()` and is embedded into each installed-plugin
 * row by `PluginAdminService::listPlugins()` so the Installed tab can
 * render an inline "Update available" badge + Update button without a
 * separate registry round-trip.
 */
export interface IAdminPluginAvailableUpdate {
    pluginId: string;
    name: string;
    installedVersion: string;
    availableVersion: string;
    diffKind: 'patch' | 'minor' | 'major' | 'unknown';
    sourceName: string;
    trustLevel: 'official' | 'reviewed' | 'untrusted' | string;
    manifestUrl?: string | null;
    manifest?: Record<string, unknown> | null;
    registryEntry: Record<string, unknown>;
}

export interface IAdminPluginSummary {
    pluginId: string;
    name: string;
    description?: string | null;
    version: string;
    pluginApiVersion: string;
    enabled: boolean;
    trustLevel: 'official' | 'reviewed' | 'untrusted';
    installMode: 'development' | 'managed' | 'trusted';
    capabilities: string[];
    frontendRuntimeUrl?: string | null;
    frontendRuntimeStylesheetUrl?: string | null;
    frontendRuntimeIntegrity?: string | null;
    frontendRuntimeFormat?: string | null;
    mobilePackage?: string | null;
    mobilePackageVersion?: string | null;
    installedAt: string;
    updatedAt: string;
    enabledAt?: string | null;
    disabledAt?: string | null;
    compatibility?: IAdminPluginCompatibility;
    /**
     * Cross-referenced registry entry advertising a strictly-newer
     * version of this plugin. `null` when the registry has no newer
     * version, when the registry lookup failed, or when no registry
     * source is enabled.
     */
    availableUpdate?: IAdminPluginAvailableUpdate | null;
}

export interface IAdminPluginOperation {
    id: number;
    pluginId: string;
    type: 'install' | 'update' | 'enable' | 'disable' | 'uninstall' | 'purge' | 'rollback' | 'repair';
    status: 'requested' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'rolled_back';
    requestedVersion?: string | null;
    fromVersion?: string | null;
    toVersion?: string | null;
    installMode: 'development' | 'managed' | 'trusted';
    errorSummary?: string | null;
    startedAt?: string | null;
    finishedAt?: string | null;
    createdAt: string;
    logs?: Array<{ stage?: string; at: string; data?: unknown }> | null;
}

/**
 * POST /admin/plugins/install can return EITHER a normal
 * IAdminPluginOperation envelope (when an install or update is
 * dispatched) OR a "no-op" payload when the plugin is already
 * installed at the requested version. The discriminator is
 * `installAction`.
 */
export interface IAdminPluginInstallDispatched extends IAdminPluginOperation {
    installAction: 'install_dispatched' | 'update_dispatched';
    redirectedToUpdate: boolean;
    existingVersion?: string | null;
    requestedVersion?: string | null;
    diffKind?: 'patch' | 'minor' | 'major' | 'unknown' | null;
    message?: string | null;
}

export interface IAdminPluginInstallAlreadyInstalled {
    installAction: 'already_installed';
    redirectedToUpdate: false;
    pluginId: string;
    existingVersion: string;
    requestedVersion: string;
    message: string;
}

export type IAdminPluginInstallResult =
    | IAdminPluginInstallDispatched
    | IAdminPluginInstallAlreadyInstalled;

export interface IAdminPluginSource {
    id: number;
    name: string;
    kind: 'public-registry' | 'private-registry' | 'git' | 'local';
    url: string;
    channel?: string;
    trustLevel?: 'official' | 'reviewed' | 'untrusted';
    authHeaderName?: string | null;
    authSecretEnvVar?: string | null;
    enabled: boolean;
    /**
     * Host-managed source (e.g. the default `humdek-public` registry).
     * System sources are read-only via the admin API except for the
     * `enabled` toggle. The UI hides every destructive action and
     * disables every non-enabled field for these rows.
     */
    isSystem?: boolean;
    lastSyncedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface IAdminPluginFeatureFlag {
    id: number;
    pluginId: string;
    flagKey: string;
    scope: 'global' | 'role' | 'group' | 'user';
    scopeValue: string;
    enabled: boolean;
    updatedAt: string;
}

export interface IAdminPluginDetail extends IAdminPluginSummary {
    manifest: Record<string, unknown>;
    operations?: IAdminPluginOperation[];
    featureFlags?: IAdminPluginFeatureFlag[];
}

/**
 * Envelope returned by `GET /admin/plugins`. The backend wraps the
 * installed-plugin array in an object that also exposes the current
 * install mode and safe-mode state so the admin page can render the
 * "Installing in development mode" / "Safe mode active" banners
 * without a second request.
 */
export interface IAdminPluginListResponse {
    plugins: IAdminPluginSummary[];
    installMode: 'development' | 'managed' | 'trusted';
    safeMode: boolean;
}

/**
 * Standardized compatibility-error payload. Snake_case to match the backend
 * `CompatibilityError::toArray()` and the shared `@selfhelp/shared`
 * `IUpdatePreflightCheck` compatibility fields, so core preflight and plugin
 * install/update render the SAME shape (blocking component + required range).
 */
export interface IPluginCompatibilityError {
    component: 'plugin' | 'frontend' | 'core' | string;
    component_id: string;
    current_version?: string | null;
    target_version?: string | null;
    required_range: string;
    blocking: boolean;
    message: string;
}

/**
 * The picker state of ONE published version of a plugin. `state` distinguishes
 * `latest-compatible` (the default selection), a plain `compatible` older/newer
 * version, an `incompatible` version (carries a human `reason`), and `selected`
 * (legacy single-version sources). Mirrors `PluginAdminService::versionRow()`.
 */
export interface IAdminPluginAvailableVersion {
    version: string;
    channel?: string;
    official: boolean;
    compatible: boolean;
    blocking: boolean;
    selected: boolean;
    requiredRange: string;
    requiredPluginApiRange: string;
    reason?: string | null;
    releaseUrl?: string | null;
    state: 'latest-compatible' | 'compatible' | 'incompatible' | 'selected';
    registryEntry: Record<string, unknown> | null;
}

/**
 * One entry returned by `GET /admin/plugins/available`. Aggregates
 * registry-advertised plugins from every enabled `PluginSource`. Unified
 * registry sources publish MULTIPLE versions per plugin, so the entry carries
 * the full `versions` list plus the resolver's selection/compatibility summary
 * (`selectedVersion` = newest COMPATIBLE; `latestVersion` = newest overall;
 * `compatibilityError` set only when nothing is compatible). The picker installs
 * the chosen version's `registryEntry`. Legacy single-version sources collapse
 * to a one-row `versions` list so the UI renders both uniformly. Mirrors
 * `PluginAdminService::buildUnifiedAvailableEntry()` / `buildLegacyAvailableEntry()`.
 */
export interface IAdminPluginAvailable {
    sourceName: string;
    pluginId: string;
    name: string;
    description?: string | null;
    version: string;
    channel?: string;
    trustLevel: string;
    homepage?: string | null;
    manifest?: Record<string, unknown> | null;
    manifestUrl?: string | null;
    registryEntry: Record<string, unknown> | null;
    installed?: boolean;
    pinned?: boolean;
    latestVersion?: string | null;
    latestCompatibleVersion?: string | null;
    selectedVersion?: string | null;
    hasCompatibleVersion?: boolean;
    newerExistsButIncompatible?: boolean;
    compatibilityError?: IPluginCompatibilityError | null;
    versions?: IAdminPluginAvailableVersion[];
}

export interface IAdminPluginAvailableResponse {
    plugins: IAdminPluginAvailable[];
}

export interface IAdminPluginHealthReport {
    pluginId: string;
    checks: Array<{ name: string; status: 'ok' | 'warning' | 'error'; message: string }>;
}

export interface IAdminPluginDoctorReport {
    siteChecks: Array<{ name: string; status: 'ok' | 'warning' | 'error'; message: string }>;
    plugins: Array<{
        pluginId: string;
        version: string;
        enabled: boolean;
        compatibility: IAdminPluginCompatibility;
    }>;
    safeMode: boolean;
}
