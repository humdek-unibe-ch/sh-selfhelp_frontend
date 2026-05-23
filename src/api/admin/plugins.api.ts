/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Admin Plugin Manager API client.
 *
 * Wraps the `App\Controller\Api\V1\Admin\Plugin\*` endpoints. The
 * helpers below return the already-unwrapped envelope so callers can
 * dispatch directly into React Query without re-extracting the
 * `data` field.
 *
 * No-polling policy:
 *   - `useAdminPlugins` is configured with `staleTime: Infinity`; the
 *     admin shell subscribes to the Mercure `selfhelp/plugins/state`
 *     topic and invalidates the query when an operation completes.
 *   - The list query is cheap on its own, so we do *not* introduce a
 *     refresh interval.
 */

import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import type {
    IAdminPluginAvailableResponse,
    IAdminPluginDetail,
    IAdminPluginDoctorReport,
    IAdminPluginFeatureFlag,
    IAdminPluginHealthReport,
    IAdminPluginListResponse,
    IAdminPluginOperation,
    IAdminPluginSource,
} from '../../types/responses/admin/plugins.types';

export const AdminPluginApi = {
    async listPlugins(): Promise<IBaseApiResponse<IAdminPluginListResponse>> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_PLUGINS_LIST);
        return response.data;
    },

    async listAvailable(): Promise<IBaseApiResponse<IAdminPluginAvailableResponse>> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_PLUGINS_AVAILABLE);
        return response.data;
    },

    async listUpdates(): Promise<IBaseApiResponse<{
        updates: Array<{
            pluginId: string;
            name: string;
            installedVersion: string;
            availableVersion: string;
            diffKind: 'patch' | 'minor' | 'major' | 'unknown';
            sourceName: string;
            trustLevel: string;
            manifestUrl?: string | null;
            manifest?: Record<string, unknown> | null;
            registryEntry: Record<string, unknown>;
        }>;
    }>> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_PLUGINS_UPDATES);
        return response.data;
    },

    async getPlugin(pluginId: string): Promise<IBaseApiResponse<IAdminPluginDetail>> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_DETAIL, pluginId);
        return response.data;
    },

    /**
     * Unified install endpoint. Dispatches a single `InstallPluginMessage`
     * regardless of the source (registry, url, paste, archive).
     *
     * For `source ∈ {registry, url, paste}` pass a JSON body with the
     * source-specific fields. For `source = 'archive'` pass the
     * `.shplugin` file as a `File` and the helper sends multipart.
     */
    async install(body:
        | { source: 'registry'; registryEntry: Record<string, unknown>; sourceName?: string }
        | { source: 'url'; manifestUrl: string; registryEntry?: Record<string, unknown> | null }
        | { source: 'paste'; manifest: Record<string, unknown>; registryEntry?: Record<string, unknown> | null }
        | { source: 'archive'; archive: File; forceMajor?: boolean; backupBefore?: boolean }
    ): Promise<IBaseApiResponse<IAdminPluginOperation>> {
        if (body.source === 'archive') {
            const formData = new FormData();
            formData.append('source', 'archive');
            formData.append('archive', body.archive);
            if (body.forceMajor !== undefined) formData.append('forceMajor', String(body.forceMajor));
            if (body.backupBefore !== undefined) formData.append('backupBefore', String(body.backupBefore));
            const response = await permissionAwareApiClient.post(
                API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_INSTALL,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } },
            );
            return response.data;
        }
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_INSTALL, body);
        return response.data;
    },

    /**
     * Pre-install inspection for `.shplugin` uploads. Returns the parsed
     * manifest + compatibility / capabilities / signature status so the
     * UI can render a preview card before committing.
     */
    async inspectArchive(archive: File): Promise<IBaseApiResponse<{
        manifest: Record<string, unknown>;
        compatibility: { severity: 'ok' | 'warning' | 'blocking'; reasons: string[] };
        capabilities: string[];
        signatureStatus: 'verified' | 'missing' | 'invalid';
    }>> {
        const formData = new FormData();
        formData.append('archive', archive);
        const response = await permissionAwareApiClient.post(
            API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_INSPECT_ARCHIVE,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return response.data;
    },

    /**
     * Unified update endpoint. Same body shape as `install` except the
     * plugin id is encoded in the URL.
     */
    async update(
        pluginId: string,
        body:
            | { source: 'registry'; registryEntry: Record<string, unknown>; sourceName?: string; forceMajor?: boolean; backupBefore?: boolean }
            | { source: 'url'; manifestUrl: string; registryEntry?: Record<string, unknown> | null; forceMajor?: boolean; backupBefore?: boolean }
            | { source: 'paste'; manifest: Record<string, unknown>; registryEntry?: Record<string, unknown> | null; forceMajor?: boolean; backupBefore?: boolean }
            | { source: 'archive'; archive: File; forceMajor?: boolean; backupBefore?: boolean },
    ): Promise<IBaseApiResponse<IAdminPluginOperation>> {
        if (body.source === 'archive') {
            const formData = new FormData();
            formData.append('source', 'archive');
            formData.append('archive', body.archive);
            if (body.forceMajor !== undefined) formData.append('forceMajor', String(body.forceMajor));
            if (body.backupBefore !== undefined) formData.append('backupBefore', String(body.backupBefore));
            const response = await permissionAwareApiClient.post(
                API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_UPDATE,
                formData,
                pluginId,
                { headers: { 'Content-Type': 'multipart/form-data' } },
            );
            return response.data;
        }
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_UPDATE, body, pluginId);
        return response.data;
    },

    async enable(pluginId: string): Promise<IBaseApiResponse<IAdminPluginDetail>> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_ENABLE, undefined, pluginId);
        return response.data;
    },

    async disable(pluginId: string): Promise<IBaseApiResponse<IAdminPluginDetail>> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_DISABLE, undefined, pluginId);
        return response.data;
    },

    async uninstall(pluginId: string): Promise<IBaseApiResponse<{ pluginId: string }>> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_UNINSTALL, undefined, pluginId);
        return response.data;
    },

    async purge(pluginId: string, confirmedPluginId: string): Promise<IBaseApiResponse<{ pluginId: string }>> {
        const response = await permissionAwareApiClient.post(
            API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_PURGE,
            { confirmedPluginId },
            pluginId,
        );
        return response.data;
    },

    async repair(pluginId?: string): Promise<IBaseApiResponse<unknown>> {
        if (pluginId) {
            const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_REPAIR, undefined, pluginId);
            return response.data;
        }
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_REPAIR_ALL);
        return response.data;
    },

    async listSources(): Promise<IBaseApiResponse<IAdminPluginSource[]>> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_SOURCES_LIST);
        return response.data;
    },

    async createSource(body: Partial<IAdminPluginSource> & { name: string; kind: string; url: string }): Promise<IBaseApiResponse<IAdminPluginSource>> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_SOURCES_CREATE, body);
        return response.data;
    },

    async updateSource(sourceId: number, body: Partial<IAdminPluginSource>): Promise<IBaseApiResponse<IAdminPluginSource>> {
        const response = await permissionAwareApiClient.put(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_SOURCE_UPDATE, body, sourceId);
        return response.data;
    },

    async deleteSource(sourceId: number): Promise<IBaseApiResponse<unknown>> {
        const response = await permissionAwareApiClient.delete(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_SOURCE_DELETE, sourceId);
        return response.data;
    },

    async listOperations(pluginId?: string): Promise<IBaseApiResponse<IAdminPluginOperation[]>> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_OPERATIONS_LIST, {
            params: pluginId ? { pluginId } : undefined,
        });
        return response.data;
    },

    async getOperation(operationId: number): Promise<IBaseApiResponse<IAdminPluginOperation>> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_OPERATION_DETAIL, operationId);
        return response.data;
    },

    async rollbackOperation(operationId: number): Promise<IBaseApiResponse<IAdminPluginOperation>> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_OPERATION_ROLLBACK, undefined, operationId);
        return response.data;
    },

    async listFeatureFlags(pluginId: string): Promise<IBaseApiResponse<IAdminPluginFeatureFlag[]>> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_FEATURE_FLAGS_LIST, pluginId);
        return response.data;
    },

    async setFeatureFlag(pluginId: string, body: { flagKey: string; scope?: string; scopeValue?: string; enabled: boolean }): Promise<IBaseApiResponse<IAdminPluginFeatureFlag>> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_FEATURE_FLAGS_SET, body, pluginId);
        return response.data;
    },

    async health(pluginId: string): Promise<IBaseApiResponse<IAdminPluginHealthReport>> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_PLUGIN_HEALTH, pluginId);
        return response.data;
    },

    async doctor(): Promise<IBaseApiResponse<IAdminPluginDoctorReport>> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_PLUGINS_DOCTOR);
        return response.data;
    },

    async enableSafeMode(): Promise<IBaseApiResponse<{ safeMode: boolean }>> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_PLUGINS_SAFE_MODE_ENABLE);
        return response.data;
    },

    async disableSafeMode(): Promise<IBaseApiResponse<{ safeMode: boolean }>> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_PLUGINS_SAFE_MODE_DISABLE);
        return response.data;
    },
};
