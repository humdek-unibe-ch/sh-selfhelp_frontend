/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type {
    ISystemVersionResponse,
    ISystemHealthResponse,
    ISystemAdvisoriesResponse,
    ISystemMaintenanceResponse,
    IMaintenanceSetRequest,
    IUpdatePreflightResponse,
    IUpdateStatusResponse,
    IUpdateRequestResponse,
    IUpdateReleasesResponse,
    IUpdateRequest,
    IFrontendUpdateReleasesResponse,
    IFrontendUpdatePreflightResponse,
    IFrontendUpdateRequestResponse,
    IFrontendUpdateRequest,
    IMobilePreviewUpdateReleasesResponse,
    IMobilePreviewUpdatePreflightResponse,
    IMobilePreviewUpdateRequestResponse,
    IMobilePreviewUpdateRequest,
} from '../../shared';

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
        const response = await permissionAwareApiClient.get<ISystemVersionResponse>(API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_VERSION);
        return response.data;
    }

    /** GET /admin/system/health — aggregated, instance-scoped health/status. */
    static async getHealth(): Promise<ISystemHealthResponse> {
        const response = await permissionAwareApiClient.get<ISystemHealthResponse>(API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_HEALTH);
        return response.data;
    }

    /**
     * GET /admin/system/advisories — security advisories from the registry feed
     * filtered to the components installed on THIS instance. Fails soft to
     * `available: false` when the registry is unreachable.
     */
    static async getAdvisories(): Promise<ISystemAdvisoriesResponse> {
        const response = await permissionAwareApiClient.get<ISystemAdvisoriesResponse>(API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_ADVISORIES);
        return response.data;
    }

    /** GET /admin/system/maintenance — current maintenance-mode state. */
    static async getMaintenance(): Promise<ISystemMaintenanceResponse> {
        const response = await permissionAwareApiClient.get<ISystemMaintenanceResponse>(API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_MAINTENANCE);
        return response.data;
    }

    /**
     * PUT /admin/system/maintenance — enable/disable maintenance for THIS
     * instance. The payload intentionally has no `instance_id`.
     */
    static async setMaintenance(body: IMaintenanceSetRequest): Promise<ISystemMaintenanceResponse> {
        const response = await permissionAwareApiClient.put<ISystemMaintenanceResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_MAINTENANCE_SET,
            body
        );
        return response.data;
    }

    /** GET /admin/system/update/preflight?target=… — compatibility verdict. */
    static async getUpdatePreflight(target: string): Promise<IUpdatePreflightResponse> {
        const response = await permissionAwareApiClient.get<IUpdatePreflightResponse>(
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
        const response = await permissionAwareApiClient.post<IUpdateRequestResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_UPDATE_REQUEST,
            body
        );
        return response.data;
    }

    /** GET /admin/system/update/status — status/progress for THIS instance. */
    static async getUpdateStatus(): Promise<IUpdateStatusResponse> {
        const response = await permissionAwareApiClient.get<IUpdateStatusResponse>(API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_UPDATE_STATUS);
        return response.data;
    }

    /**
     * GET /admin/system/update/releases — core versions published in the
     * official registry (newest first) for the target-version picker. Fails
     * soft to `available: false` when the registry is unreachable.
     */
    static async getUpdateReleases(): Promise<IUpdateReleasesResponse> {
        const response = await permissionAwareApiClient.get<IUpdateReleasesResponse>(API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_UPDATE_RELEASES);
        return response.data;
    }

    /**
     * GET /admin/system/update/frontend/releases — frontend versions published
     * in the official registry (newest first) for the frontend-only update
     * picker. Fails soft to `available: false` when the registry is unreachable.
     */
    static async getFrontendUpdateReleases(): Promise<IFrontendUpdateReleasesResponse> {
        const response = await permissionAwareApiClient.get<IFrontendUpdateReleasesResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_UPDATE_FRONTEND_RELEASES
        );
        return response.data;
    }

    /**
     * GET /admin/system/update/frontend/preflight?target=… — lightweight
     * compatibility verdict for a frontend-only target. The frontend is
     * stateless, so the preflight never reports a destructive migration; the
     * SelfHelp Manager performs the authoritative frontend ⇄ core + signature
     * checks at execution time.
     */
    static async getFrontendUpdatePreflight(target: string): Promise<IFrontendUpdatePreflightResponse> {
        const response = await permissionAwareApiClient.get<IFrontendUpdatePreflightResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_UPDATE_FRONTEND_PREFLIGHT,
            { params: { target } }
        );
        return response.data;
    }

    /**
     * POST /admin/system/update/frontend/request — request a frontend-only
     * update for THIS instance. The payload intentionally has no `instance_id`
     * and no `accepted_migration_risk` (a frontend swap is stateless).
     */
    static async requestFrontendUpdate(body: IFrontendUpdateRequest): Promise<IFrontendUpdateRequestResponse> {
        const response = await permissionAwareApiClient.post<IFrontendUpdateRequestResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_UPDATE_FRONTEND_REQUEST,
            body
        );
        return response.data;
    }

    /**
     * GET /admin/system/update/mobile-preview/releases — mobile-preview image
     * versions published in the official registry (newest first) for the
     * mobile-preview update picker. Fails soft to `available: false` when the
     * registry is unreachable.
     */
    static async getMobilePreviewUpdateReleases(): Promise<IMobilePreviewUpdateReleasesResponse> {
        const response = await permissionAwareApiClient.get<IMobilePreviewUpdateReleasesResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_UPDATE_MOBILE_PREVIEW_RELEASES
        );
        return response.data;
    }

    /**
     * GET /admin/system/update/mobile-preview/preflight?target=… — lightweight
     * compatibility verdict for a mobile-preview target. The preview is
     * stateless, so the preflight never reports a destructive migration; the
     * SelfHelp Manager performs the authoritative preview ⇄ core + per-plugin
     * RN/Expo + signature checks at execution time.
     */
    static async getMobilePreviewUpdatePreflight(target: string): Promise<IMobilePreviewUpdatePreflightResponse> {
        const response = await permissionAwareApiClient.get<IMobilePreviewUpdatePreflightResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_UPDATE_MOBILE_PREVIEW_PREFLIGHT,
            { params: { target } }
        );
        return response.data;
    }

    /**
     * POST /admin/system/update/mobile-preview/request — request a
     * mobile-preview-only update (or enable/bootstrap) for THIS instance. The
     * payload intentionally has no `instance_id` and no `accepted_migration_risk`
     * (a preview swap is stateless).
     */
    static async requestMobilePreviewUpdate(body: IMobilePreviewUpdateRequest): Promise<IMobilePreviewUpdateRequestResponse> {
        const response = await permissionAwareApiClient.post<IMobilePreviewUpdateRequestResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_UPDATE_MOBILE_PREVIEW_REQUEST,
            body
        );
        return response.data;
    }
}
