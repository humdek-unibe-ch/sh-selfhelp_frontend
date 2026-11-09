/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';

/** The users list and its CSV export send the same group/role filters. */
const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock('../../base.api', () => ({
    permissionAwareApiClient: { get: getMock },
}));

import { AdminUserApi } from '../user.api';
import { API_CONFIG } from '../../../config/api.config';

describe('AdminUserApi filters', () => {
    beforeEach(() => getMock.mockReset());

    it('filters the users list by role', async () => {
        getMock.mockResolvedValue({ data: { data: { users: [], pagination: {} } } });

        await AdminUserApi.getUsers({ page: 1, id_groups: 3, id_roles: 5 });

        expect(getMock).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.ADMIN_USERS_GET_ALL, {
            params: { page: '1', id_groups: '3', id_roles: '5' },
        });
    });

    it('exports with the same role filter', async () => {
        getMock.mockResolvedValue({ data: new Blob(), headers: {} });

        await AdminUserApi.exportUsersCsv({ status: 'active', id_roles: 5 });

        expect(getMock).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.ADMIN_USERS_EXPORT_CSV, {
            params: { status: 'active', id_roles: '5' },
            responseType: 'blob',
        });
    });
});
