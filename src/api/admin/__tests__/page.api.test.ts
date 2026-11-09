/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Regression guard: `post(endpoint, body, ...routeArgs)` takes the body
 * second, so restore-from-version must pass an empty body before the
 * pageId/versionId route args. Passing pageId as the body built
 * `/admin/pages/{versionId}/sections/restore-from-version/undefined` (404).
 */
const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock('../../base.api', () => ({
    permissionAwareApiClient: { post: postMock },
}));

import { AdminPageApi } from '../page.api';
import { API_CONFIG } from '../../../config/api.config';

describe('AdminPageApi.restoreFromVersion', () => {
    beforeEach(() => {
        postMock.mockReset();
    });

    it('restores the given page from the given version instead of a 404 url', async () => {
        postMock.mockResolvedValue({ data: { data: { sections_restored: 3 } } });

        await AdminPageApi.restoreFromVersion(478, 2);

        expect(postMock).toHaveBeenCalledWith(
            API_CONFIG.ENDPOINTS.ADMIN_PAGE_VERSIONS_RESTORE_FROM_VERSION,
            {},
            478,
            2,
        );
        const [endpoint, , ...routeArgs] = postMock.mock.calls[0] as [
            typeof API_CONFIG.ENDPOINTS.ADMIN_PAGE_VERSIONS_RESTORE_FROM_VERSION,
            unknown,
            number,
            number,
        ];
        expect(endpoint.route(...routeArgs)).toBe('/admin/pages/478/sections/restore-from-version/2');
    });
});
