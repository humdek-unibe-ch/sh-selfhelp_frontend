/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminScheduledJobsApi } from '../api/admin/scheduled-jobs.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { IScheduledJobFilters, IUpdateRunnerSettingsRequest } from '../types/responses/admin/scheduled-jobs.types';
import { notifications } from '@mantine/notifications';

/**
 * Hook to fetch scheduled jobs with filtering and pagination
 */
export function useScheduledJobs(filters: IScheduledJobFilters = {}) {
    return useQuery({
        queryKey: ['scheduledJobs', filters],
        queryFn: () => AdminScheduledJobsApi.getScheduledJobs(filters),
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
        enabled: true, // Always enabled to fetch data
    });
}

/**
 * Hook to fetch scheduled jobs until the last page for the specific period
 */

export function useScheduledJobsAll(filters: IScheduledJobFilters = {}) {
    return useQuery({
        queryKey: ['scheduledJobsAll', filters],
        queryFn: () => AdminScheduledJobsApi.getScheduledJobs({
            ...filters,
            // Page undefined → backend returns all jobs (with safety limit)
            page: undefined,
        }),
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
        select: (response) => {
            // Extract the scheduledJobs array from the response
            const data = response?.data ?? response;

            return {
                scheduledJobs: data?.scheduledJobs ?? [],
                totalCount: data?.totalCount ?? 0,
            };
        },
    });
}

/**
 * Hook to fetch a specific scheduled job by ID
 */
export function useScheduledJob(jobId: number, enabled: boolean = true) {
    return useQuery({
        queryKey: ['scheduledJob', jobId],
        queryFn: () => AdminScheduledJobsApi.getScheduledJob(jobId),
        enabled: enabled && !!jobId,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
    });
}

/**
 * Hook to fetch scheduled job transactions
 */
export function useScheduledJobTransactions(jobId: number, enabled: boolean = true) {
    return useQuery({
        queryKey: ['scheduledJobTransactions', jobId],
        queryFn: () => AdminScheduledJobsApi.getScheduledJobTransactions(jobId),
        enabled: enabled && !!jobId,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
    });
}



/**
 * Hook to execute a scheduled job
 */
export function useExecuteScheduledJobMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (jobId: number) => AdminScheduledJobsApi.executeScheduledJob(jobId),
        onSuccess: (data, jobId) => {

            notifications.show({
                title: 'Job Executed',
                message: `Job ${jobId} has been executed successfully`,
                color: 'green',
            });

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['scheduledJobs'] });
            queryClient.invalidateQueries({ queryKey: ['scheduledJob', jobId] });
            queryClient.invalidateQueries({ queryKey: ['scheduledJobsAll'] }); // For calendar view
        },
        onError: (error, jobId) => {

            notifications.show({
                title: 'Execution Failed',
                message: `Failed to execute job ${jobId}`,
                color: 'red',
            });
        },
    });
}

/**
 * Hook to fetch the Docker scheduled-job runner status.
 */
export function useScheduledJobRunnerStatus(enabled: boolean = true) {
    return useQuery({
        queryKey: ['scheduledJobRunnerStatus'],
        queryFn: () => AdminScheduledJobsApi.getRunnerStatus(),
        select: (response) => response.data,
        enabled,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
    });
}

/**
 * Hook to fetch the scheduled-job type catalog (core lookups + plugin types).
 */
export function useScheduledJobTypes(enabled: boolean = true) {
    return useQuery({
        queryKey: ['scheduledJobTypes'],
        queryFn: () => AdminScheduledJobsApi.getJobTypes(),
        select: (response) => response.data?.types ?? [],
        enabled,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.STATIC.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.STATIC.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
    });
}

/**
 * Hook to update runner settings (interval, max jobs, lock TTL, stale window, enabled).
 */
export function useUpdateRunnerSettingsMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (settings: IUpdateRunnerSettingsRequest) => AdminScheduledJobsApi.updateRunnerSettings(settings),
        onSuccess: () => {
            notifications.show({
                title: 'Runner Updated',
                message: 'Scheduled-job runner settings saved',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['scheduledJobRunnerStatus'] });
        },
        onError: () => {
            notifications.show({
                title: 'Update Failed',
                message: 'Failed to update runner settings',
                color: 'red',
            });
        },
    });
}

/**
 * Hook to enable/disable the runner.
 */
export function useToggleRunnerMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (enabled: boolean) =>
            enabled ? AdminScheduledJobsApi.enableRunner() : AdminScheduledJobsApi.disableRunner(),
        onSuccess: (_data, enabled) => {
            notifications.show({
                title: enabled ? 'Runner Enabled' : 'Runner Disabled',
                message: enabled ? 'The scheduled-job runner is now enabled' : 'The scheduled-job runner is now disabled',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['scheduledJobRunnerStatus'] });
        },
        onError: () => {
            notifications.show({
                title: 'Update Failed',
                message: 'Failed to change runner state',
                color: 'red',
            });
        },
    });
}

/**
 * Hook to run all due jobs now (manual trigger, force = true).
 */
export function useRunDueJobsNowMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => AdminScheduledJobsApi.runDueJobsNow(),
        onSuccess: (response) => {
            const run = response.data?.run;
            notifications.show({
                title: 'Run Complete',
                message: run
                    ? `Status: ${run.status} — ${run.done_count} done, ${run.failed_count} failed, ${run.skipped_count} skipped`
                    : 'Due jobs processed',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['scheduledJobRunnerStatus'] });
            queryClient.invalidateQueries({ queryKey: ['scheduledJobs'] });
            queryClient.invalidateQueries({ queryKey: ['scheduledJobsAll'] });
        },
        onError: () => {
            notifications.show({
                title: 'Run Failed',
                message: 'Failed to run due jobs',
                color: 'red',
            });
        },
    });
}

/**
 * Hook to delete a scheduled job
 */
export function useDeleteScheduledJobMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (jobId: number) => AdminScheduledJobsApi.deleteScheduledJob(jobId),
        onSuccess: (data, jobId) => {

            notifications.show({
                title: 'Job Deleted',
                message: `Job ${jobId} has been deleted successfully`,
                color: 'green',
            });

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['scheduledJobs'] });
            queryClient.invalidateQueries({ queryKey: ['scheduledJob', jobId] });
            queryClient.invalidateQueries({ queryKey: ['scheduledJobsAll'] }); // For calendar view
        },
        onError: (error, jobId) => {

            notifications.show({
                title: 'Deletion Failed',
                message: `Failed to delete job ${jobId}`,
                color: 'red',
            });
        },
    });
} 