import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminScheduledJobsApi } from '../api/admin/scheduled-jobs.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { IScheduledJobFilters } from '../types/responses/admin/scheduled-jobs.types';
import { notifications } from '@mantine/notifications';
import { debug } from '../utils/debug-logger';

/**
 * Hook to fetch scheduled jobs with filtering and pagination
 */
export function useScheduledJobs(filters: IScheduledJobFilters = {}) {
    return useQuery({
        queryKey: ['scheduledJobs', filters],
        queryFn: () => AdminScheduledJobsApi.getScheduledJobs(filters),
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
        enabled: true, // Always enabled to fetch data
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
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
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
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
    });
}

/**
 * Hook to fetch available job statuses
 */
export function useScheduledJobStatuses() {
    return useQuery({
        queryKey: ['scheduledJobStatuses'],
        queryFn: () => AdminScheduledJobsApi.getScheduledJobStatuses(),
        staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
    });
}

/**
 * Hook to fetch available job types
 */
export function useScheduledJobTypes() {
    return useQuery({
        queryKey: ['scheduledJobTypes'],
        queryFn: () => AdminScheduledJobsApi.getScheduledJobTypes(),
        staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
    });
}

/**
 * Hook to fetch available search date types
 */
export function useScheduledJobSearchDateTypes() {
    return useQuery({
        queryKey: ['scheduledJobSearchDateTypes'],
        queryFn: () => AdminScheduledJobsApi.getScheduledJobSearchDateTypes(),
        staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
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
            debug('Scheduled job executed successfully', 'useExecuteScheduledJobMutation', {
                jobId,
                newStatus: data.data?.status
            });

            notifications.show({
                title: 'Job Executed',
                message: `Job ${jobId} has been executed successfully`,
                color: 'green',
            });

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['scheduledJobs'] });
            queryClient.invalidateQueries({ queryKey: ['scheduledJob', jobId] });
        },
        onError: (error, jobId) => {
            debug('Failed to execute scheduled job', 'useExecuteScheduledJobMutation', {
                jobId,
                error
            });

            notifications.show({
                title: 'Execution Failed',
                message: `Failed to execute job ${jobId}`,
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
            debug('Scheduled job deleted successfully', 'useDeleteScheduledJobMutation', {
                jobId,
                newStatus: data.data?.status
            });

            notifications.show({
                title: 'Job Deleted',
                message: `Job ${jobId} has been deleted successfully`,
                color: 'green',
            });

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['scheduledJobs'] });
            queryClient.invalidateQueries({ queryKey: ['scheduledJob', jobId] });
        },
        onError: (error, jobId) => {
            debug('Failed to delete scheduled job', 'useDeleteScheduledJobMutation', {
                jobId,
                error
            });

            notifications.show({
                title: 'Deletion Failed',
                message: `Failed to delete job ${jobId}`,
                color: 'red',
            });
        },
    });
} 