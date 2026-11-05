/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';

/**
 * Row actions are permission-gated so a user is never offered an action the
 * backend would refuse: Delete needs `admin.asset.delete`, Edit needs
 * `admin.asset.update`; View and Download only need read.
 */
const { hasPermission } = vi.hoisted(() => ({ hasPermission: vi.fn() }));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission }, user: null, isLoading: false, error: null }),
}));
vi.mock('../../../../../../hooks/useGroups', () => ({
    useGroups: () => ({ data: { groups: [] }, isLoading: false }),
}));
vi.mock('../../../../../../hooks/useAssets', () => ({
    useAssets: () => ({
        data: {
            assets: [{
                id: 1,
                uuid: '11111111-1111-4111-8111-111111111111',
                name: 'logo.png',
                file_path: 'uploads/assets/11111111-1111-4111-8111-111111111111',
                url: '/cms-api/v1/assets/11111111-1111-4111-8111-111111111111',
                mime_type: 'image/png',
                size: 10,
                alt: null,
                groups: [],
                created_at: '2026-11-03T10:00:00+00:00',
                updated_at: '2026-11-03T10:00:00+00:00',
            }],
            pagination: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
        },
        isLoading: false,
        error: null,
    }),
    useDeleteAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useBulkAssetGroups: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useBulkDeleteAssets: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useAssetFolders: () => ({ data: [] }),
    useSaveAssetFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeleteAssetFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCreateAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCreateMultipleAssets: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpdateAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { AssetsList } from '../AssetsList';

describe('AssetsList action gating', () => {
    beforeEach(() => hasPermission.mockReset());

    it('shows Edit and Delete when the user may update and delete assets', async () => {
        hasPermission.mockImplementation((p: string) =>
            p === PERMISSIONS.ADMIN_ASSET_DELETE || p === PERMISSIONS.ADMIN_ASSET_UPDATE
        );
        renderWithProviders(<AssetsList folderId={null} onFolderChange={vi.fn()} />);
        expect(await screen.findByText('logo.png')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Edit logo.png' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete logo.png' })).toBeInTheDocument();
    });

    it('offers only View and Download to a read-only user', async () => {
        hasPermission.mockReturnValue(false);
        renderWithProviders(<AssetsList folderId={null} onFolderChange={vi.fn()} />);
        expect(await screen.findByText('logo.png')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /download/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edit logo.png' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Delete logo.png' })).not.toBeInTheDocument();
    });
});
