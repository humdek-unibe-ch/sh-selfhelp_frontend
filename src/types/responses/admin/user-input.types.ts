import { IBaseApiResponse } from '../common/response-envelope.types';

export interface IUserInputEntry {
    id: number;
    timestamp: string;
    name: string;
    email: string;
    message: string;
    data: Record<string, any>;
    form_name?: string;
    user_id?: number;
}

export interface IUserInputListData {
    entries: IUserInputEntry[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface IUserInputFilters {
    page?: number;
    pageSize?: number;
    search?: string;
    form_name?: string;
    user_id?: number;
    dateFrom?: string;
    dateTo?: string;
    sort?: 'id' | 'timestamp' | 'name' | 'email';
    sortDirection?: 'asc' | 'desc';
}

export type TUserInputListResponse = IBaseApiResponse<IUserInputListData>;
export type TUserInputDeleteResponse = IBaseApiResponse<{ success: boolean }>; 