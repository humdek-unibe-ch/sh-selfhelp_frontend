/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type {
    IAdminDataRecordHistoryResponse,
    IAdminDataRecordRestoreRequest,
    IAdminDataRecordRestoreResponse,
    IAdminDataRecordVersionResponse,
    IFormListHistoryData,
    TFormListRestoreData,
} from '../../shared';
import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';

/** Admin data-browser record history (contract 6). */
export class AdminDataHistoryApi {
    static async history(tableName: string, recordId: number, page = 1, pageSize = 20): Promise<IFormListHistoryData> {
        const response = await permissionAwareApiClient.get<IAdminDataRecordHistoryResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_DATA_RECORD_HISTORY,
            tableName,
            recordId,
            { params: { page, page_size: pageSize } },
        );
        return response.data.data;
    }

    static async version(tableName: string, recordId: number, version: number): Promise<IAdminDataRecordVersionResponse['data']> {
        const response = await permissionAwareApiClient.get<IAdminDataRecordVersionResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_DATA_RECORD_VERSION,
            tableName,
            recordId,
            version,
        );
        return response.data.data;
    }

    static async restore(tableName: string, recordId: number, body: IAdminDataRecordRestoreRequest): Promise<TFormListRestoreData> {
        const response = await permissionAwareApiClient.post<IAdminDataRecordRestoreResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_DATA_RECORD_RESTORE,
            body,
            tableName,
            recordId,
        );
        return response.data.data;
    }
}
