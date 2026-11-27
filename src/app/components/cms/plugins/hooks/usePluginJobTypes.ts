/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { AdminPluginApi } from '../../../../../api/admin/plugins.api';
import { REACT_QUERY_CONFIG } from '../../../../../config/react-query.config';
import { parseApiError } from '../../../../../utils/mutation-error-handler';
import type { IPluginJobType } from './pluginJobTypes.types';

/** Registry root for plugin settings queries (invalidate on save). */
export const PLUGIN_SETTINGS_QUERY_ROOT = ['admin-plugin-settings'] as const;

export const PLUGIN_JOB_TYPES_QUERY_KEY = ['admin-actions-plugin-job-types'] as const;

function asPluginJobTypes(raw: unknown): IPluginJobType[] {
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is IPluginJobType => {
        if (!item || typeof item !== 'object') return false;
        const row = item as Record<string, unknown>;
        return typeof row.type === 'string' && typeof row.plugin_id === 'string' && typeof row.label === 'string';
    }).map((item) => ({
        type: item.type,
        plugin_id: item.plugin_id,
        label: item.label,
        config_schema: (item.config_schema as IPluginJobType['config_schema']) ?? { type: 'object' },
        resource_fields:
            item.resource_fields && typeof item.resource_fields === 'object'
                ? (item.resource_fields as Record<string, string>)
                : {},
    }));
}

/** Action-plannable plugin job types for the action builder (C12). */
export function usePluginJobTypes(enabled = true) {
    return useQuery({
        queryKey: PLUGIN_JOB_TYPES_QUERY_KEY,
        queryFn: async () => asPluginJobTypes(await AdminPluginApi.listPluginJobTypes()),
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.LOOKUPS.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.LOOKUPS.gcTime,
        enabled,
    });
}

/** Host-stored plugin settings for the admin detail form (C14). */
export function usePluginSettings(pluginId: string | null, enabled = true) {
    return useQuery({
        queryKey: [...PLUGIN_SETTINGS_QUERY_ROOT, pluginId ?? ''],
        queryFn: () => AdminPluginApi.getSettings(pluginId as string),
        enabled: Boolean(pluginId) && enabled,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.ADMIN_PAGES.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.ADMIN_PAGES.gcTime,
    });
}

export function useUpdatePluginSettings(pluginId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (values: Record<string, string | number | boolean | null>) =>
            AdminPluginApi.putSettings(pluginId, values),
        onSuccess: (data) => {
            queryClient.setQueryData([...PLUGIN_SETTINGS_QUERY_ROOT, pluginId], data);
            void queryClient.invalidateQueries({ queryKey: PLUGIN_SETTINGS_QUERY_ROOT });
            notifications.show({ color: 'green', title: 'Settings saved', message: pluginId });
        },
        onError: (error: unknown) => {
            const { errorTitle, errorMessage } = parseApiError(error);
            notifications.show({ color: 'red', title: errorTitle, message: errorMessage });
        },
    });
}
