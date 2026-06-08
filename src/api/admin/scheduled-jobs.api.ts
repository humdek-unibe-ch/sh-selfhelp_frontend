/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import {
    TScheduledJobsListResponse,
    TScheduledJobDetailResponse,
    TScheduledJobTransactionsResponse,
    IScheduledJobFilters,
    TRunnerStatusResponse,
    TRunnerRunNowResponse,
    TScheduledJobTypesResponse,
    IUpdateRunnerSettingsRequest
} from '../../types/responses/admin/scheduled-jobs.types';



export class AdminScheduledJobsApi {
    /**
     * Get all scheduled jobs with filtering and pagination
     */
    static async getScheduledJobs(filters: IScheduledJobFilters = {}): Promise<TScheduledJobsListResponse> {
        const params = new URLSearchParams();

        if (filters.page) params.append('page', filters.page.toString());
        if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.status) params.append('status', filters.status);
        if (filters.jobType) params.append('jobType', filters.jobType);
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
        if (filters.dateType) params.append('dateType', filters.dateType);
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
        if (filters.includeTransactions) params.append('includeTransactions', filters.includeTransactions.toString());
        if (filters.userId) params.append('userId', filters.userId.toString());
        if (filters.actionId) params.append('actionId', filters.actionId.toString());

        const response = await permissionAwareApiClient.get(
            API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_GET_ALL,
            { params: Object.fromEntries(params) }
        );
        return response.data;
    }

    /**
     * Get a specific scheduled job by ID
     */
    static async getScheduledJob(jobId: number): Promise<TScheduledJobDetailResponse> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_GET_ONE, jobId);
        return response.data;
    }

    /**
     * Execute a scheduled job
     */
    static async executeScheduledJob(jobId: number): Promise<TScheduledJobDetailResponse> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_EXECUTE, undefined, jobId);
        return response.data;
    }

    /**
     * Delete a scheduled job (soft delete)
     */
    static async deleteScheduledJob(jobId: number): Promise<TScheduledJobDetailResponse> {
        const response = await permissionAwareApiClient.delete(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_DELETE, jobId);
        return response.data;
    }

    /**
     * Get transactions for a specific scheduled job
     */
    static async getScheduledJobTransactions(jobId: number): Promise<TScheduledJobTransactionsResponse> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_TRANSACTIONS, jobId);
        return response.data;
    }

    /**
     * Get the Docker scheduled-job runner status (settings, last run, queue, health).
     */
    static async getRunnerStatus(): Promise<TRunnerStatusResponse> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_RUNNER_STATUS);
        return response.data;
    }

    /**
     * Update the runner settings (interval, max jobs, lock TTL, stale window, enabled).
     */
    static async updateRunnerSettings(settings: IUpdateRunnerSettingsRequest): Promise<TRunnerStatusResponse> {
        const response = await permissionAwareApiClient.put(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_RUNNER_SETTINGS, settings);
        return response.data;
    }

    /**
     * Enable the runner.
     */
    static async enableRunner(): Promise<TRunnerStatusResponse> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_RUNNER_ENABLE, undefined);
        return response.data;
    }

    /**
     * Disable the runner.
     */
    static async disableRunner(): Promise<TRunnerStatusResponse> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_RUNNER_DISABLE, undefined);
        return response.data;
    }

    /**
     * Execute all due jobs now through the runner service (trigger = manual, force = true).
     */
    static async runDueJobsNow(): Promise<TRunnerRunNowResponse> {
        const response = await permissionAwareApiClient.post(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_RUNNER_RUN_NOW, undefined);
        return response.data;
    }

    /**
     * Get the catalog of available scheduled-job types (core + plugin contributions).
     */
    static async getJobTypes(): Promise<TScheduledJobTypesResponse> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_TYPES);
        return response.data;
    }
} 