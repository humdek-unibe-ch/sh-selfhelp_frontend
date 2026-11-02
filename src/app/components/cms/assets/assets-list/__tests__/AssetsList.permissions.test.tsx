/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';

/**
 * The asset delete action must be permission-gated: only a user holding
 * `admin.asset.delete` sees the Delete button. This guards the fix for the
 * generic-403 problem (a non-permitted user shouldn't even be offered the action).
 */
const { hasPermission } = vi.hoisted(() => ({ hasPermission: vi.fn() }));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission }, user: null, isLoading: false, error: null }),
}));
vi.mock('../../../../../../hooks/useAssets', () => ({
    useAssets: () => ({
        data: {
            assets: [{
                id: 1,
                file_name: 'logo.png',
                file_path: 'uploads/assets/champ/logo.png',
                url: '/cms-api/v1/assets/champ/logo.png',
                folder: 'champ',
            }],
            pagination: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
        },
        isLoading: false,
        error: null,
    }),
    useDeleteAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useAssetFolders: () => ({ data: { folders: [{ folder: 'champ', is_open_access: false }] } }),
}));

import { AssetsList } from '../AssetsList';

describe('AssetsList delete gating', () => {
    beforeEach(() => hasPermission.mockReset());

    it('shows the Delete action when the user has admin.asset.delete', async () => {
        hasPermission.mockImplementation((p: string) => p === PERMISSIONS.ADMIN_ASSET_DELETE);
        renderWithProviders(<AssetsList />);
        expect(await screen.findByText('logo.png')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /download/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/delete/i)).toBeInTheDocument();
    });

    it('hides the Delete action when the user lacks admin.asset.delete', async () => {
        hasPermission.mockReturnValue(false);
        renderWithProviders(<AssetsList />);
        expect(await screen.findByText('logo.png')).toBeInTheDocument();
        // View + Download remain (read-only), Delete is gone.
        expect(screen.getByRole('link', { name: /download/i })).toBeInTheDocument();
        expect(screen.queryByLabelText(/delete/i)).not.toBeInTheDocument();
    });
});
