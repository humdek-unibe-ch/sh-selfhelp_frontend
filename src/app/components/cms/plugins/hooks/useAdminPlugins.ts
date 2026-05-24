/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * React Query hooks for the admin plugin manager.
 *
 * Every hook uses `staleTime: Infinity`. Reactivity is supplied by
 * Mercure: the admin shell subscribes to `selfhelp/plugins/state` and
 * calls `queryClient.invalidateQueries(['admin-plugins'])` whenever an
 * operation event arrives. No background polling is performed.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminPluginApi } from '../../../../../api/admin/plugins.api';

const KEY = ['admin-plugins'] as const;
const OPERATIONS_KEY = ['admin-plugin-operations'] as const;
const SOURCES_KEY = ['admin-plugin-sources'] as const;

export function useAdminPlugins() {
    return useQuery({
        queryKey: [...KEY, 'list'],
        queryFn: async () => (await AdminPluginApi.listPlugins()).data,
        staleTime: Infinity,
    });
}

/**
 * Returns the plugins advertised by every enabled `PluginSource` that
 * are not yet installed. Powers the admin UI's "Available" tab so an
 * admin can install registry-listed plugins with one click.
 *
 * Staleness is controlled by Mercure invalidations on the
 * `selfhelp/plugins/state` topic plus an explicit "Refresh" button in
 * the Available tab; no background polling.
 */
export function useAdminPluginsAvailable(enabled: boolean = true) {
    return useQuery({
        queryKey: [...KEY, 'available'],
        queryFn: async () => (await AdminPluginApi.listAvailable()).data,
        staleTime: Infinity,
        enabled,
    });
}

export function useAdminPlugin(pluginId: string | null) {
    return useQuery({
        queryKey: [...KEY, 'detail', pluginId ?? ''],
        queryFn: async () => (await AdminPluginApi.getPlugin(pluginId as string)).data,
        enabled: Boolean(pluginId),
        staleTime: Infinity,
    });
}

export function useAdminPluginOperations(pluginId?: string) {
    return useQuery({
        queryKey: [...OPERATIONS_KEY, pluginId ?? 'all'],
        queryFn: async () => (await AdminPluginApi.listOperations(pluginId)).data,
        staleTime: Infinity,
    });
}

export function useAdminPluginSources() {
    return useQuery({
        queryKey: [...SOURCES_KEY],
        queryFn: async () => (await AdminPluginApi.listSources()).data,
        staleTime: Infinity,
    });
}

export function useAdminPluginEnable() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (pluginId: string) => AdminPluginApi.enable(pluginId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEY });
            qc.invalidateQueries({ queryKey: ['plugins-manifest'] });
        },
    });
}

export function useAdminPluginDisable() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (pluginId: string) => AdminPluginApi.disable(pluginId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEY });
            qc.invalidateQueries({ queryKey: ['plugins-manifest'] });
        },
    });
}

export function useAdminPluginUninstall() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (pluginId: string) => AdminPluginApi.uninstall(pluginId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEY });
            qc.invalidateQueries({ queryKey: ['plugins-manifest'] });
        },
    });
}

export function useAdminPluginPurge() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ pluginId, confirmedPluginId }: { pluginId: string; confirmedPluginId: string }) =>
            AdminPluginApi.purge(pluginId, confirmedPluginId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEY });
            qc.invalidateQueries({ queryKey: ['plugins-manifest'] });
        },
    });
}

export function useAdminPluginRollback() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (operationId: number) => AdminPluginApi.rollbackOperation(operationId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEY });
            qc.invalidateQueries({ queryKey: OPERATIONS_KEY });
        },
    });
}

export function useAdminPluginCancelOperation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (operationId: number) => AdminPluginApi.cancelOperation(operationId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEY });
            qc.invalidateQueries({ queryKey: OPERATIONS_KEY });
        },
    });
}

export function useAdminPluginRepair() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (pluginId?: string) => AdminPluginApi.repair(pluginId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEY });
            qc.invalidateQueries({ queryKey: ['plugins-manifest'] });
        },
    });
}

export function useAdminPluginSafeMode(enabled: boolean) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => (enabled ? AdminPluginApi.enableSafeMode() : AdminPluginApi.disableSafeMode()),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEY });
        },
    });
}

export function useAdminPluginSourceCreate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: Parameters<typeof AdminPluginApi.createSource>[0]) =>
            AdminPluginApi.createSource(body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: SOURCES_KEY });
            qc.invalidateQueries({ queryKey: [...KEY, 'available'] });
        },
    });
}

export function useAdminPluginSourceUpdate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ sourceId, body }: { sourceId: number; body: Parameters<typeof AdminPluginApi.updateSource>[1] }) =>
            AdminPluginApi.updateSource(sourceId, body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: SOURCES_KEY });
            qc.invalidateQueries({ queryKey: [...KEY, 'available'] });
        },
    });
}

export function useAdminPluginSourceDelete() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (sourceId: number) => AdminPluginApi.deleteSource(sourceId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: SOURCES_KEY });
            qc.invalidateQueries({ queryKey: [...KEY, 'available'] });
        },
    });
}

export function useAdminPluginHealth(pluginId: string | null) {
    return useQuery({
        queryKey: [...KEY, 'health', pluginId ?? ''],
        queryFn: async () => (await AdminPluginApi.health(pluginId as string)).data,
        enabled: Boolean(pluginId),
        staleTime: Infinity,
    });
}

export function useAdminPluginDoctor() {
    return useQuery({
        queryKey: [...KEY, 'doctor'],
        queryFn: async () => (await AdminPluginApi.doctor()).data,
        staleTime: Infinity,
    });
}

/**
 * Single-step install mutation. Dispatches an InstallPluginMessage
 * regardless of the source (registry / url / paste / archive). The
 * Messenger worker streams progress over Mercure.
 */
export function useAdminPluginInstall() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: Parameters<typeof AdminPluginApi.install>[0]) =>
            AdminPluginApi.install(body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEY });
            qc.invalidateQueries({ queryKey: OPERATIONS_KEY });
        },
    });
}

/**
 * Pre-install inspection for `.shplugin` uploads. Returns the parsed
 * manifest + compatibility + capabilities + signatureStatus without
 * triggering an install.
 *
 * The optional `trustedKey` field carries a per-request trust
 * override used by the inspect-archive trust-helper panel — see
 * `AdminPluginApi.inspectArchive` for semantics.
 */
export function useAdminPluginInspectArchive() {
    return useMutation({
        mutationFn: ({ archive, trustedKey }: {
            archive: File;
            trustedKey?: { keyId: string; publicKeyBase64: string };
        }) => AdminPluginApi.inspectArchive(archive, trustedKey),
    });
}

/**
 * Single-step update mutation. Same body shape as install except
 * pluginId is encoded in the URL.
 */
export function useAdminPluginUpdate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ pluginId, body }: {
            pluginId: string;
            body: Parameters<typeof AdminPluginApi.update>[1];
        }) => AdminPluginApi.update(pluginId, body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEY });
            qc.invalidateQueries({ queryKey: OPERATIONS_KEY });
        },
    });
}

export function useAdminPluginFeatureFlagSet() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ pluginId, flagKey, scope, scopeValue, enabled }: { pluginId: string; flagKey: string; scope?: string; scopeValue?: string; enabled: boolean }) =>
            AdminPluginApi.setFeatureFlag(pluginId, { flagKey, scope, scopeValue, enabled }),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: [...KEY, 'detail', variables.pluginId] });
            qc.invalidateQueries({ queryKey: [...KEY, 'feature-flags', variables.pluginId] });
        },
    });
}
