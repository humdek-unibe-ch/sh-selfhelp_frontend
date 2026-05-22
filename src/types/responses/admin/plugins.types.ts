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
    frontendPackage?: string | null;
    frontendPackageVersion?: string | null;
    mobilePackage?: string | null;
    mobilePackageVersion?: string | null;
    installedAt: string;
    updatedAt: string;
    enabledAt?: string | null;
    disabledAt?: string | null;
    compatibility?: IAdminPluginCompatibility;
}

export interface IAdminPluginOperation {
    id: number;
    pluginId: string;
    type: 'install' | 'update' | 'enable' | 'disable' | 'uninstall' | 'purge' | 'rollback' | 'repair';
    status: 'requested' | 'running' | 'succeeded' | 'failed' | 'rolled_back';
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
 * One entry returned by `GET /admin/plugins/available`. Aggregates
 * registry-advertised plugins from every enabled `PluginSource`. The
 * UI exposes a one-click "Install" action that pre-fills the install
 * modal with `manifest` (or fetches `manifestUrl` if `manifest` is
 * not embedded).
 */
export interface IAdminPluginAvailable {
    sourceName: string;
    pluginId: string;
    name: string;
    description?: string | null;
    version: string;
    trustLevel: string;
    homepage?: string | null;
    manifest?: Record<string, unknown> | null;
    manifestUrl?: string | null;
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
