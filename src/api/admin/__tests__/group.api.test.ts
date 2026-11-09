/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Contract guard for the group-scoped asset-folder ACL methods: read hits
 * GET /admin/groups/{id}/asset-acls (groupId passed positionally to the route
 * function), and update PUTs the full replacement body with the same route arg.
 */
const { getMock, putMock } = vi.hoisted(() => ({
    getMock: vi.fn(),
    putMock: vi.fn(),
}));

vi.mock('../../base.api', () => ({
    permissionAwareApiClient: { get: getMock, put: putMock },
}));

import { AdminGroupApi } from '../group.api';
import { API_CONFIG } from '../../../config/api.config';
import type { IGroupAssetAclsResponse } from '../../../types/responses/admin/groups.types';

describe('AdminGroupApi asset-folder ACLs', () => {
    beforeEach(() => {
        getMock.mockReset();
        putMock.mockReset();
    });

    it('reads a group\'s asset-folder ACLs with the groupId route arg', async () => {
        const acls: IGroupAssetAclsResponse = {
            acls: [
                { folder: 'images', access_level: 'manage' },
                { folder: 'docs', access_level: 'read' },
            ],
        };
        getMock.mockResolvedValue({ data: { data: acls } });

        const result = await AdminGroupApi.getGroupAssetAcls(7);

        expect(getMock).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.ADMIN_GROUPS_ASSET_ACLS_GET, 7);
        expect(result.acls).toHaveLength(2);
        expect(result.acls[0]).toEqual({ folder: 'images', access_level: 'manage' });
    });

    it('full-replaces a group\'s asset-folder ACLs by PUT with the body + groupId', async () => {
        const updated: IGroupAssetAclsResponse = { acls: [{ folder: 'images', access_level: 'read' }] };
        putMock.mockResolvedValue({ data: { data: updated } });

        const data = { acls: [{ folder: 'images', access_level: 'read' as const }] };
        const result = await AdminGroupApi.updateGroupAssetAcls(7, data);

        expect(putMock).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.ADMIN_GROUPS_ASSET_ACLS_UPDATE, data, 7);
        expect(result.acls[0].access_level).toBe('read');
    });

    it('clears a group\'s asset access with an empty acls array', async () => {
        const cleared: IGroupAssetAclsResponse = { acls: [] };
        putMock.mockResolvedValue({ data: { data: cleared } });

        const result = await AdminGroupApi.updateGroupAssetAcls(7, { acls: [] });

        expect(putMock).toHaveBeenCalledWith(API_CONFIG.ENDPOINTS.ADMIN_GROUPS_ASSET_ACLS_UPDATE, { acls: [] }, 7);
        expect(result.acls).toEqual([]);
    });
});
