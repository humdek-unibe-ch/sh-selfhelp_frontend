/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IMobilePreviewSessionData } from '../../../shared';

/**
 * Regression guard for the page-editor mobile-preview session mint.
 *
 * The mint MUST go through `permissionAwareApiClient` with the
 * `ADMIN_MOBILE_PREVIEW_SESSION` endpoint config (which carries the
 * `admin.mobile_preview.create` permission). The previous implementation used
 * the raw `apiClient`, so the permission-metadata request guard threw
 * "Permission metadata missing for API call: /api/mobile-preview/session" and
 * the preview iframe never loaded. These tests fail if anyone reverts to the
 * raw client or drops the permission metadata from the endpoint.
 */
const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock('../../base.api', () => ({
    permissionAwareApiClient: { post: postMock },
}));

import { AdminMobilePreviewApi } from '../mobile-preview.api';
import { API_CONFIG } from '../../../config/api.config';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

const sessionData: IMobilePreviewSessionData = {
    code: '9f15b9eed1c75c8e77bd42bde19a6e88',
    expires_at: '2026-06-23 19:05:30',
};

describe('AdminMobilePreviewApi', () => {
    beforeEach(() => {
        postMock.mockReset();
    });

    it('mints through the permission-aware client with the scoped body', async () => {
        postMock.mockResolvedValue({ data: { data: sessionData } });

        const result = await AdminMobilePreviewApi.createSession({
            keyword: 'test',
            page_id: 94,
            language_id: 1,
            draft: true,
        });

        expect(postMock).toHaveBeenCalledWith(
            API_CONFIG.ENDPOINTS.ADMIN_MOBILE_PREVIEW_SESSION,
            { keyword: 'test', page_id: 94, language_id: 1, draft: true },
        );
        expect(result).toEqual(sessionData);
    });

    it('routes the mint at the dedicated BFF path gated by admin.mobile_preview.create', () => {
        // The crux of the bug: the endpoint MUST carry permission metadata so the
        // request guard (permission-wrapper.api) does not reject the call.
        expect(API_CONFIG.ENDPOINTS.ADMIN_MOBILE_PREVIEW_SESSION.route).toBe('/mobile-preview/session');
        expect(API_CONFIG.ENDPOINTS.ADMIN_MOBILE_PREVIEW_SESSION.permissions).toContain(
            PERMISSIONS.ADMIN_MOBILE_PREVIEW_CREATE,
        );
        expect(PERMISSIONS.ADMIN_MOBILE_PREVIEW_CREATE).toBe('admin.mobile_preview.create');
    });

    it('throws when the mint response omits the one-time code', async () => {
        postMock.mockResolvedValue({ data: { data: { expires_at: sessionData.expires_at } } });

        await expect(AdminMobilePreviewApi.createSession({ keyword: 'test' })).rejects.toThrow(
            /did not include a code/i,
        );
    });
});
