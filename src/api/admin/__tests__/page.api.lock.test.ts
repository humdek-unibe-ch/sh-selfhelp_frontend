/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * The four page edit lock calls (live sync C9) and the version the page read hands to the
 * client (C8): right route, right method, right permission (P6-A3).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock, postMock, deleteMock } = vi.hoisted(() => ({
    getMock: vi.fn(),
    postMock: vi.fn(),
    deleteMock: vi.fn(),
}));

vi.mock('../../base.api', () => ({
    permissionAwareApiClient: { get: getMock, post: postMock, delete: deleteMock },
}));

import { AdminPageApi } from '../page.api';
import { API_CONFIG } from '../../../config/api.config';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';
import { getPageDraftVersion, resetPageDraftVersionsForTests } from '../../../utils/page-draft-version.utils';

const STATUS = {
    page_id: 12,
    held: true,
    mine: true,
    holder: { id: 1, name: 'Me' },
    expires_at: null,
    idle_expires_at: null,
};

describe('page edit lock endpoints', () => {
    beforeEach(() => {
        getMock.mockReset();
        postMock.mockReset();
        deleteMock.mockReset();
        resetPageDraftVersionsForTests();
    });

    it('declare the lock routes with the page update permission', () => {
        const endpoints = API_CONFIG.ENDPOINTS;
        expect(endpoints.ADMIN_PAGES_LOCK_GET.route(12)).toBe('/admin/pages/12/lock');
        expect(endpoints.ADMIN_PAGES_LOCK_ACQUIRE.route(12)).toBe('/admin/pages/12/lock');
        expect(endpoints.ADMIN_PAGES_LOCK_RELEASE.route(12)).toBe('/admin/pages/12/lock');
        expect(endpoints.ADMIN_PAGES_LOCK_TAKE_OVER.route(12)).toBe('/admin/pages/12/lock/take-over');
        // GET is also readable by delete/publish/version-delete callers (F259).
        expect(endpoints.ADMIN_PAGES_LOCK_GET.permissions).toEqual([
            PERMISSIONS.ADMIN_PAGE_UPDATE,
            PERMISSIONS.ADMIN_PAGE_DELETE,
            PERMISSIONS.ADMIN_PAGE_VERSION_PUBLISH,
            PERMISSIONS.ADMIN_PAGE_VERSION_DELETE,
        ]);
        for (const endpoint of [
            endpoints.ADMIN_PAGES_LOCK_ACQUIRE,
            endpoints.ADMIN_PAGES_LOCK_RELEASE,
            endpoints.ADMIN_PAGES_LOCK_TAKE_OVER,
        ]) {
            expect(endpoint.permissions).toEqual([PERMISSIONS.ADMIN_PAGE_UPDATE]);
        }
    });

    it('read the status with GET', async () => {
        getMock.mockResolvedValue({ data: { data: STATUS } });

        await expect(AdminPageApi.getPageLock(12)).resolves.toEqual(STATUS);

        expect(getMock).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.ADMIN_PAGES_LOCK_GET, 12);
    });

    it('acquire (and renew) with POST and an empty body before the route argument', async () => {
        postMock.mockResolvedValue({ data: { data: STATUS } });

        await expect(AdminPageApi.acquirePageLock(12)).resolves.toEqual(STATUS);

        expect(postMock).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.ADMIN_PAGES_LOCK_ACQUIRE, {}, 12);
    });

    it('take over with POST on the take-over route', async () => {
        postMock.mockResolvedValue({ data: { data: STATUS } });

        await AdminPageApi.takeOverPageLock(12);

        expect(postMock).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.ADMIN_PAGES_LOCK_TAKE_OVER, {}, 12);
    });

    it('release with DELETE; on pagehide the request is kept alive', async () => {
        deleteMock.mockResolvedValue({ data: { data: { ...STATUS, held: false } } });

        await AdminPageApi.releasePageLock(12);
        expect(deleteMock).toHaveBeenLastCalledWith(API_CONFIG.ENDPOINTS.ADMIN_PAGES_LOCK_RELEASE, 12);

        await AdminPageApi.releasePageLock(12, { keepalive: true });
        expect(deleteMock).toHaveBeenLastCalledWith(API_CONFIG.ENDPOINTS.ADMIN_PAGES_LOCK_RELEASE, 12, {
            headers: {},
            adapter: 'fetch',
            fetchOptions: { keepalive: true },
        });
    });

    it('the page read hands its draft version to the client', async () => {
        getMock.mockResolvedValue({ data: { data: { page: {}, fields: [], draft_version: 7 } } });

        await AdminPageApi.getPageFields(12);

        expect(getPageDraftVersion(12)).toBe(7);
    });
});
