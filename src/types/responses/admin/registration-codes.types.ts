/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface IRegistrationCode {
    code: string;
    id_groups: number;
    group_name: string;
    created_at: string;
    consumed_at: string | null;
    is_consumed: boolean;
}

export interface IRegistrationCodesListParams {
    page?: number;
    pageSize?: number;
    search?: string;
    id_groups?: number;
    status?: 'available' | 'used';
    sort?: 'created_at' | 'consumed_at';
    sortDirection?: 'asc' | 'desc';
}

export interface IRegistrationCodesPagination {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface IRegistrationCodesListResponse {
    codes: IRegistrationCode[];
    pagination: IRegistrationCodesPagination;
}
