/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../test-utils/renderWithProviders';

/**
 * Regression guard for the asset-folder ACL field-naming collision.
 *
 * The group's "Asset Folders" tab must seed from the DEDICATED
 * `GET /admin/groups/{id}/asset-acls` endpoint (`getGroupAssetAcls`), whose
 * `acls` are folder grants — NOT from the group-details payload, whose own
 * `acls` are page ACLs (and are legitimately `[]` for a group with no page
 * grants). A group with empty page ACLs but real folder grants fooled us for
 * several messages; this pins the two apart so they can never be crossed.
 */
const { getGroupAssetAcls, updateGroupAssetAcls, getGroupById } = vi.hoisted(() => ({
    getGroupAssetAcls: vi.fn(),
    updateGroupAssetAcls: vi.fn(),
    getGroupById: vi.fn(),
}));

vi.mock('../../api/admin/group.api', () => ({
    AdminGroupApi: { getGroupAssetAcls, updateGroupAssetAcls, getGroupById },
}));
vi.mock('@mantine/notifications', () => ({
    notifications: { show: vi.fn() },
}));

import { useGroupAssetAcls, useUpdateGroupAssetAcls } from '../useGroups';

function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

describe('useGroupAssetAcls', () => {
    beforeEach(() => {
        getGroupAssetAcls.mockReset();
        updateGroupAssetAcls.mockReset();
        getGroupById.mockReset();
    });

    it('reads folder grants from the asset-acls endpoint, not group-details', async () => {
        getGroupAssetAcls.mockResolvedValue({
            acls: [
                { folder: 'champ', access_level: 'read' },
                { folder: 'goalkeeper', access_level: 'manage' },
            ],
        });

        const { result } = renderHook(() => useGroupAssetAcls(2), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        // The dedicated endpoint is used; group-details is never touched here.
        expect(getGroupAssetAcls).toHaveBeenCalledWith(2);
        expect(getGroupById).not.toHaveBeenCalled();
        expect(result.current.data?.acls).toEqual([
            { folder: 'champ', access_level: 'read' },
            { folder: 'goalkeeper', access_level: 'manage' },
        ]);
    });

    it('is disabled (no fetch) until a group is selected', () => {
        const { result } = renderHook(() => useGroupAssetAcls(null), { wrapper });

        expect(result.current.fetchStatus).toBe('idle');
        expect(getGroupAssetAcls).not.toHaveBeenCalled();
    });

    it('surfaces an empty asset-acls list without falling back to page acls', async () => {
        // A group can legitimately have folder grants === [] here; this must NOT
        // be conflated with the group-details page `acls: []`.
        getGroupAssetAcls.mockResolvedValue({ acls: [] });

        const { result } = renderHook(() => useGroupAssetAcls(2), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data?.acls).toEqual([]);
        expect(getGroupById).not.toHaveBeenCalled();
    });

    it('full-replaces a group\'s folder grants through the asset-acls endpoint', async () => {
        updateGroupAssetAcls.mockResolvedValue({ acls: [{ folder: 'champ', access_level: 'read' }] });

        const { result } = renderHook(() => useUpdateGroupAssetAcls(), { wrapper });
        const data = { acls: [{ folder: 'champ', access_level: 'read' as const }] };
        result.current.mutate({ groupId: 2, data });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(updateGroupAssetAcls).toHaveBeenCalledWith(2, data);
    });
});
