/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import type {
    IRegistrationCode,
    IRegistrationCodesListResponse,
} from '../../types/responses/admin/registration-codes.types';
import type { ICreateRegistrationCodeRequest } from '../../types/requests/admin/registration-codes.types';

export const AdminRegistrationCodesApi = {
    async getAll(): Promise<IRegistrationCodesListResponse> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<IRegistrationCodesListResponse>>(
            API_CONFIG.ENDPOINTS.ADMIN_REGISTRATION_CODES_GET_ALL
        );
        return response.data.data;
    },

    async create(data: ICreateRegistrationCodeRequest): Promise<IRegistrationCode> {
        const response = await permissionAwareApiClient.post<IBaseApiResponse<IRegistrationCode>>(
            API_CONFIG.ENDPOINTS.ADMIN_REGISTRATION_CODES_CREATE,
            data
        );
        return response.data.data;
    },

    async delete(code: string): Promise<void> {
        await permissionAwareApiClient.delete(
            API_CONFIG.ENDPOINTS.ADMIN_REGISTRATION_CODES_DELETE,
            code
        );
    },
};
