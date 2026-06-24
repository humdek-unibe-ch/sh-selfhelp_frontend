/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Admin Mobile Preview API.
 *
 * Mints the SHORT-LIVED, single-use code the page-editor preview panel puts in
 * the preview iframe URL. Unlike the other admin clients this does NOT hit the
 * `/cms-api` catch-all proxy: it calls the dedicated, authenticated BFF mint
 * route (`POST /api/mobile-preview/session` -> Symfony
 * `POST /cms-api/v1/admin/mobile-preview/session`). That hop keeps the admin JWT
 * server-side; only the opaque `{ code, expires_at }` envelope reaches the
 * browser. The backend still enforces the `admin.mobile_preview.create`
 * permission.
 *
 * @module api/admin/mobile-preview.api
 */

import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type {
    IMobilePreviewSessionData,
    IMobilePreviewSessionRequest,
    IMobilePreviewSessionResponse,
} from '../../shared';

export const AdminMobilePreviewApi = {
    /**
     * Mint a one-time preview code for the current admin, optionally scoped to a
     * page / language / draft. Each iframe (re)load consumes one code on
     * exchange, so the panel mints afresh on every reload.
     *
     * Routed through `permissionAwareApiClient` (the required default) so the
     * request carries the `admin.mobile_preview.create` permission metadata the
     * client-side guard enforces; the dedicated BFF route still keeps the admin
     * JWT server-side and the backend re-checks the same permission.
     */
    async createSession(
        scope: IMobilePreviewSessionRequest = {},
    ): Promise<IMobilePreviewSessionData> {
        const response = await permissionAwareApiClient.post<IMobilePreviewSessionResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_MOBILE_PREVIEW_SESSION,
            scope,
        );
        const data = response.data?.data;
        if (!data?.code) {
            throw new Error('Mobile preview mint response did not include a code.');
        }
        return data;
    },
};
