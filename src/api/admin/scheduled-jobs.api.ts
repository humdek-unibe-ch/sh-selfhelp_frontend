import { apiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import {
    TScheduledJobsListResponse,
    TScheduledJobDetailResponse,
    TScheduledJobTransactionsResponse,
    TScheduledJobStatusesResponse,
    TScheduledJobTypesResponse,
    IScheduledJobFilters
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

        const queryString = params.toString();
        const url = queryString ? `${API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_GET_ALL}?${queryString}` : API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_GET_ALL;
        
        const response = await apiClient.get(url);
        return response.data;
    }

    /**
     * Get a specific scheduled job by ID
     */
    static async getScheduledJob(jobId: number): Promise<TScheduledJobDetailResponse> {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_GET_ONE(jobId));
        return response.data;
    }

    /**
     * Execute a scheduled job
     */
    static async executeScheduledJob(jobId: number): Promise<TScheduledJobDetailResponse> {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_EXECUTE(jobId));
        return response.data;
    }

    /**
     * Delete a scheduled job (soft delete)
     */
    static async deleteScheduledJob(jobId: number): Promise<TScheduledJobDetailResponse> {
        const response = await apiClient.delete(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_DELETE(jobId));
        return response.data;
    }

    /**
     * Get transactions for a specific scheduled job
     */
    static async getScheduledJobTransactions(jobId: number): Promise<TScheduledJobTransactionsResponse> {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_TRANSACTIONS(jobId));
        return response.data;
    }

    /**
     * Get all available job statuses
     */
    static async getScheduledJobStatuses(): Promise<TScheduledJobStatusesResponse> {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_STATUSES);
        return response.data;
    }

    /**
     * Get all available job types
     */
    static async getScheduledJobTypes(): Promise<TScheduledJobTypesResponse> {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_TYPES);
        return response.data;
    }

    /**
     * Get all available search date types
     */
    static async getScheduledJobSearchDateTypes(): Promise<TScheduledJobTypesResponse> {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULED_JOBS_SEARCH_DATE_TYPES);
        return response.data;
    }
} 