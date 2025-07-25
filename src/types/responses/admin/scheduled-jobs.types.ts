import { IBaseApiResponse } from '../common/response-envelope.types';

export interface IScheduledJobTransaction {
    transaction_id: number;
    transaction_time: string;
    transaction_type: string;
    transaction_verbal_log: string;
    user: string;
}

export interface IScheduledJob {
    id: number;
    status: string;
    type: string;
    entry_date: string;
    date_to_be_executed: string;
    execution_date: string | null;
    description: string;
    recipient: string;
    title: string;
    message: string | null;
    transactions: IScheduledJobTransaction[];
}

export interface IScheduledJobsListData {
    scheduledJobs: IScheduledJob[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface IScheduledJobDetailData {
    id: number;
    status: {
        id: number;
        value: string;
    };
    job_type: {
        id: number;
        value: string;
    };
    description: string;
    date_create: string;
    date_to_be_executed: string;
    date_executed: string | null;
    config: string | null;
    users: Array<{
        id: number;
        name: string;
        email: string;
    }>;
    tasks: Array<{
        id: number;
        name: string;
        description: string;
    }>;
    transactions: IScheduledJobTransaction[];
}

export interface IScheduledJobFilters {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    jobType?: string;
    dateFrom?: string;
    dateTo?: string;
    dateType?: 'date_create' | 'date_to_be_executed' | 'date_executed';
    sort?: 'id' | 'date_create' | 'date_to_be_executed' | 'date_executed' | 'description';
    sortDirection?: 'asc' | 'desc';
}

export interface IScheduledJobStatus {
    id: number;
    value: string;
    description?: string;
}

export interface IScheduledJobType {
    id: number;
    value: string;
    description?: string;
}

export type TScheduledJobsListResponse = IBaseApiResponse<IScheduledJobsListData>;
export type TScheduledJobDetailResponse = IBaseApiResponse<IScheduledJobDetailData>;
export type TScheduledJobTransactionsResponse = IBaseApiResponse<IScheduledJobTransaction[]>;
export type TScheduledJobStatusesResponse = IBaseApiResponse<IScheduledJobStatus[]>;
export type TScheduledJobTypesResponse = IBaseApiResponse<IScheduledJobType[]>; 