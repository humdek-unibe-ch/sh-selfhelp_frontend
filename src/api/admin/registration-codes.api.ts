/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import type {
    IRegistrationCodesListResponse,
    IRegistrationCodesListParams,
    IRegistrationCodesStats,
    IGenerateRegistrationCodesResponse,
} from '../../types/responses/admin/registration-codes.types';
import type { IGenerateRegistrationCodesRequest } from '../../types/requests/admin/registration-codes.types';

export const AdminRegistrationCodesApi = {
    async getAll(params: IRegistrationCodesListParams = {}): Promise<IRegistrationCodesListResponse> {
        const q: Record<string, string> = {};
        if (params.page) q.page = String(params.page);
        if (params.pageSize) q.pageSize = String(params.pageSize);
        if (params.search) q.search = params.search;
        if (params.id_groups) q.id_groups = String(params.id_groups);
        if (params.status) q.status = params.status;
        if (params.sort) q.sort = params.sort;
        if (params.sortDirection) q.sortDirection = params.sortDirection;

        const response = await permissionAwareApiClient.get<IBaseApiResponse<IRegistrationCodesListResponse>>(
            API_CONFIG.ENDPOINTS.ADMIN_REGISTRATION_CODES_GET_ALL,
            { params: q }
        );
        return response.data.data;
    },

    async exportCsv(params: Omit<IRegistrationCodesListParams, 'page' | 'pageSize'> = {}): Promise<Blob> {
        const q: Record<string, string> = {};
        if (params.search) q.search = params.search;
        if (params.id_groups) q.id_groups = String(params.id_groups);
        if (params.status) q.status = params.status;

        const response = await permissionAwareApiClient.get<Blob>(
            API_CONFIG.ENDPOINTS.ADMIN_REGISTRATION_CODES_EXPORT,
            { params: q, responseType: 'blob' }
        );
        return response.data;
    },

    /**
     * Get the registration-code counts backing the stat tiles.
     *
     * Scoped server-side to the codes the caller can see, and deliberately
     * unfiltered: they describe that whole visible set, not the current
     * search/filter result, so the tiles stay stable while filtering.
     */
    async getStats(): Promise<IRegistrationCodesStats> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<IRegistrationCodesStats>>(
            API_CONFIG.ENDPOINTS.ADMIN_REGISTRATION_CODES_STATS
        );
        return response.data.data;
    },

    async generate(data: IGenerateRegistrationCodesRequest): Promise<IGenerateRegistrationCodesResponse> {
        const response = await permissionAwareApiClient.post<IBaseApiResponse<IGenerateRegistrationCodesResponse>>(
            API_CONFIG.ENDPOINTS.ADMIN_REGISTRATION_CODES_GENERATE,
            data
        );
        return response.data.data;
    },
};
