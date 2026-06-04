/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface IRegistrationCode {
    id: string;
    code: string;
    /** Primary (first) group id, kept for backward compatibility. See group_ids for the full set. */
    id_groups: number | null;
    /** Primary (first) group name. See group_names for the full set. */
    group_name: string | null;
    /** Every group the code grants membership to once consumed. */
    group_ids: number[];
    /** Names of every group the code grants membership to once consumed. */
    group_names: string[];
    created_at: string;
    consumed_at: string | null;
    is_consumed: boolean;
    /** ID of the user the code was linked to on consumption (null when available). */
    id_users: number | null;
    /** Email of the user the code was linked to on consumption (null when available). */
    user_email: string | null;
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

export interface IRegistrationCodesConfig {
    generate_min: number;
    generate_max: number;
}

export interface IRegistrationCodesListResponse {
    codes: IRegistrationCode[];
    pagination: IRegistrationCodesPagination;
    config: IRegistrationCodesConfig;
}

export interface IGenerateRegistrationCodesResponse {
    codes: IRegistrationCode[];
}
