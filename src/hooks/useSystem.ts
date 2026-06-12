/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { AdminSystemApi } from '../api/admin/system.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import type { IMaintenanceSetRequest, IUpdateRequest } from '../shared';

const SYSTEM_VERSION_KEY = ['systemVersion'] as const;
const SYSTEM_HEALTH_KEY = ['systemHealth'] as const;
const SYSTEM_ADVISORIES_KEY = ['systemAdvisories'] as const;
const SYSTEM_MAINTENANCE_KEY = ['systemMaintenance'] as const;
const SYSTEM_UPDATE_STATUS_KEY = ['systemUpdateStatus'] as const;
const SYSTEM_UPDATE_RELEASES_KEY = ['systemUpdateReleases'] as const;

/**
 * Current instance version summary (backend/frontend/plugin-api/db-migration +
 * installed-plugin compatibility). Read-only; scoped to THIS instance.
 */
export function useSystemVersion(enabled: boolean = true) {
    return useQuery({
        queryKey: SYSTEM_VERSION_KEY,
        queryFn: () => AdminSystemApi.getVersion(),
        select: (response) => response.data,
        enabled,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
    });
}

/**
 * Aggregated, instance-scoped health/status (DB/cache/Redis/Mercure/worker/
 * scheduler/mailer/plugins + update + safe/maintenance mode). Read-only.
 * Pass a refetch interval (ms) to keep the dashboard live.
 */
export function useSystemHealth(enabled: boolean = true, refetchInterval: number | false = false) {
    return useQuery({
        queryKey: SYSTEM_HEALTH_KEY,
        queryFn: () => AdminSystemApi.getHealth(),
        select: (response) => response.data,
        enabled,
        refetchInterval,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
    });
}

/**
 * Security advisories from the registry feed filtered to the components
 * installed on THIS instance. Read-only; `available: false` means the registry
 * could not be reached (the UI shows "could not check").
 */
export function useSystemAdvisories(enabled: boolean = true) {
    return useQuery({
        queryKey: SYSTEM_ADVISORIES_KEY,
        queryFn: () => AdminSystemApi.getAdvisories(),
        select: (response) => response.data,
        enabled,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
    });
}

/**
 * Current maintenance-mode state for THIS instance (enabled / env-forced /
 * operator note / safe-mode flag). Read-only query.
 */
export function useSystemMaintenance(enabled: boolean = true) {
    return useQuery({
        queryKey: SYSTEM_MAINTENANCE_KEY,
        queryFn: () => AdminSystemApi.getMaintenance(),
        select: (response) => response.data,
        enabled,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
    });
}

/**
 * Enable/disable maintenance mode for THIS instance (no `instance_id` — the
 * backend derives + verifies it). Refreshes the maintenance + health + version
 * caches so every system view reflects the new state immediately.
 */
export function useSetMaintenanceMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: IMaintenanceSetRequest) => AdminSystemApi.setMaintenance(body),
        onSuccess: (response) => {
            const data = response.data;
            notifications.show({
                title: 'Maintenance Mode Updated',
                message: data?.enabled
                    ? 'Maintenance mode is now ON for this instance.'
                    : 'Maintenance mode is now OFF for this instance.',
                color: data?.enabled ? 'orange' : 'green',
            });
            queryClient.invalidateQueries({ queryKey: SYSTEM_MAINTENANCE_KEY });
            queryClient.invalidateQueries({ queryKey: SYSTEM_HEALTH_KEY });
            queryClient.invalidateQueries({ queryKey: SYSTEM_VERSION_KEY });
        },
        onError: () => {
            notifications.show({
                title: 'Maintenance Update Failed',
                message: 'Could not change maintenance mode. It may be enforced by server configuration.',
                color: 'red',
            });
        },
    });
}

/**
 * Compatibility preflight for a target version. Disabled until a non-empty
 * `target` is supplied so we never call the endpoint with a missing param.
 */
export function useUpdatePreflight(target: string | null) {
    return useQuery({
        queryKey: ['systemUpdatePreflight', target],
        queryFn: () => AdminSystemApi.getUpdatePreflight(target as string),
        select: (response) => response.data,
        enabled: !!target,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
    });
}

/**
 * Status / progress of the latest update operation for THIS instance.
 * Pass a refetch interval (ms) while an operation is in flight.
 */
export function useUpdateStatus(enabled: boolean = true, refetchInterval: number | false = false) {
    return useQuery({
        queryKey: SYSTEM_UPDATE_STATUS_KEY,
        queryFn: () => AdminSystemApi.getUpdateStatus(),
        select: (response) => response.data,
        enabled,
        refetchInterval,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
    });
}

/**
 * Core versions published in the official registry (newest first) for the
 * target-version picker. `available: false` means the registry could not be
 * reached — the UI falls back to manual version entry, never blocks.
 */
export function useUpdateReleases(enabled: boolean = true) {
    return useQuery({
        queryKey: SYSTEM_UPDATE_RELEASES_KEY,
        queryFn: () => AdminSystemApi.getUpdateReleases(),
        select: (response) => response.data,
        enabled,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
    });
}

/**
 * Request an update for THIS instance (no `instance_id` — the backend derives
 * and verifies it). On success the manager picks the operation up; we refresh
 * the status so the UI starts tracking progress.
 */
export function useRequestUpdateMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: IUpdateRequest) => AdminSystemApi.requestUpdate(body),
        onSuccess: (response) => {
            const data = response.data;
            notifications.show({
                title: 'Update Requested',
                message: data
                    ? `Operation ${data.operation_id} is now ${data.status}. The SelfHelp Manager will perform it.`
                    : 'Update request recorded',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: SYSTEM_UPDATE_STATUS_KEY });
            queryClient.invalidateQueries({ queryKey: SYSTEM_VERSION_KEY });
        },
        onError: () => {
            notifications.show({
                title: 'Update Request Failed',
                message: 'The update request was rejected. Cross-instance requests are not allowed.',
                color: 'red',
            });
        },
    });
}
