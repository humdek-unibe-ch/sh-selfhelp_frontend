/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type {
    ISystemVersionResponse,
    ISystemHealthResponse,
    ISystemMaintenanceResponse,
    IMaintenanceSetRequest,
    IUpdatePreflightResponse,
    IUpdateStatusResponse,
    IUpdateRequestResponse,
    IUpdateRequest,
} from '../../types/responses/admin/system.types';

/**
 * Admin client for the instance-scoped system maintenance / update flow.
 *
 * Hard rule (mirrors the backend): the browser NEVER sends an `instance_id`.
 * The CMS derives + verifies the current instance server-side, and the
 * SelfHelp Manager (not the CMS) performs the actual Docker work. These calls
 * only read version facts, compute a compatibility preflight, and record /
 * monitor an update request for THIS instance.
 */
export class AdminSystemApi {
    /** GET /admin/system/version — current instance version summary. */
    static async getVersion(): Promise<ISystemVersionResponse> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_VERSION);
        return response.data;
    }

    /** GET /admin/system/health — aggregated, instance-scoped health/status. */
    static async getHealth(): Promise<ISystemHealthResponse> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_HEALTH);
        return response.data;
    }

    /** GET /admin/system/maintenance — current maintenance-mode state. */
    static async getMaintenance(): Promise<ISystemMaintenanceResponse> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_MAINTENANCE);
        return response.data;
    }

    /**
     * PUT /admin/system/maintenance — enable/disable maintenance for THIS
     * instance. The payload intentionally has no `instance_id`.
     */
    static async setMaintenance(body: IMaintenanceSetRequest): Promise<ISystemMaintenanceResponse> {
        const response = await permissionAwareApiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_MAINTENANCE_SET,
            body
        );
        return response.data;
    }

    /** GET /admin/system/update/preflight?target=… — compatibility verdict. */
    static async getUpdatePreflight(target: string): Promise<IUpdatePreflightResponse> {
        const response = await permissionAwareApiClient.get(
            API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_UPDATE_PREFLIGHT,
            { params: { target } }
        );
        return response.data;
    }

    /**
     * POST /admin/system/update/request — request an update for THIS instance.
     * The payload intentionally has no `instance_id`.
     */
    static async requestUpdate(body: IUpdateRequest): Promise<IUpdateRequestResponse> {
        const response = await permissionAwareApiClient.post(
            API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_UPDATE_REQUEST,
            body
        );
        return response.data;
    }

    /** GET /admin/system/update/status — status/progress for THIS instance. */
    static async getUpdateStatus(): Promise<IUpdateStatusResponse> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_UPDATE_STATUS);
        return response.data;
    }
}
