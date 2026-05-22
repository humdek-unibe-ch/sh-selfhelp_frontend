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
        onSuccess: () => qc.invalidateQueries({ queryKey: SOURCES_KEY }),
    });
}

export function useAdminPluginSourceUpdate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ sourceId, body }: { sourceId: number; body: Parameters<typeof AdminPluginApi.updateSource>[1] }) =>
            AdminPluginApi.updateSource(sourceId, body),
        onSuccess: () => qc.invalidateQueries({ queryKey: SOURCES_KEY }),
    });
}

export function useAdminPluginSourceDelete() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (sourceId: number) => AdminPluginApi.deleteSource(sourceId),
        onSuccess: () => qc.invalidateQueries({ queryKey: SOURCES_KEY }),
    });
}
