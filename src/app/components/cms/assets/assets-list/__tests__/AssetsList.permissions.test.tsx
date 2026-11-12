/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';

/**
 * Row actions are permission-gated so a user is never offered an action the
 * backend would refuse: Delete needs `admin.asset.delete`, Edit needs
 * `admin.asset.update`; View and Download need the right to view the file.
 *
 * The global permission is not enough: rights are per asset (a role manages an
 * asset only when granted on it), so the server says per asset what the caller
 * may do (`can_view` / `can_update` / `can_delete`) and the row draws from that.
 */
const { hasPermission, assetsState } = vi.hoisted(() => ({
    hasPermission: vi.fn(),
    assetsState: { assets: [] as Record<string, unknown>[] },
}));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission }, user: null, isLoading: false, error: null }),
}));
vi.mock('../../../../../../hooks/useGroups', () => ({
    useAllGroups: () => ({ data: { groups: [] }, isLoading: false }),
}));
vi.mock('../../../../../../hooks/useAssets', () => ({
    useAssets: () => ({
        data: {
            assets: assetsState.assets,
            pagination: { page: 1, pageSize: 100, total: assetsState.assets.length, totalPages: 1 },
        },
        isLoading: false,
        error: null,
    }),
    useDeleteAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useBulkAssetGroups: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useBulkDeleteAssets: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useBulkMoveAssets: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useAssetFolders: () => ({ data: [] }),
    useSaveAssetFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeleteAssetFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCreateAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpdateAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { AssetsList } from '../AssetsList';

const asset = (id: number, name: string, rights: { can_view?: boolean; can_update?: boolean; can_delete?: boolean } = {}) => ({
    id,
    uuid: `${String(id).repeat(8)}-1111-4111-8111-111111111111`,
    name,
    url: `/cms-api/v1/assets/${String(id).repeat(8)}-1111-4111-8111-111111111111`,
    mime_type: 'image/png',
    size: 10,
    alt: null,
    folder_id: null,
    roles: [],
    groups: [],
    can_view: true,
    can_update: true,
    can_delete: true,
    ...rights,
    created_at: '2026-11-03T10:00:00+00:00',
    updated_at: '2026-11-03T10:00:00+00:00',
});

const mayUpdateAndDelete = (p: string) => p === PERMISSIONS.ADMIN_ASSET_DELETE || p === PERMISSIONS.ADMIN_ASSET_UPDATE;

describe('AssetsList action gating', () => {
    beforeEach(() => {
        hasPermission.mockReset();
        assetsState.assets = [asset(1, 'logo.png')];
    });

    it('shows Edit and Delete when the user may update and delete assets', async () => {
        hasPermission.mockImplementation(mayUpdateAndDelete);
        renderWithProviders(<AssetsList />);
        expect(await screen.findByText('logo.png')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Edit logo.png' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete logo.png' })).toBeInTheDocument();
    });

    it('offers only View and Download to a read-only user', async () => {
        hasPermission.mockReturnValue(false);
        renderWithProviders(<AssetsList />);
        expect(await screen.findByText('logo.png')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /download/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edit logo.png' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Delete logo.png' })).not.toBeInTheDocument();
    });

    describe('per asset, from what the server says the caller may do', () => {
        beforeEach(() => {
            hasPermission.mockImplementation(mayUpdateAndDelete);
        });

        it('hides Edit and Delete on an asset the caller holds no update or delete grant on, though the permission is global', async () => {
            assetsState.assets = [
                asset(1, 'mine.png'),
                asset(2, 'theirs.png', { can_update: false, can_delete: false }),
            ];
            renderWithProviders(<AssetsList />);
            await screen.findByText('theirs.png');

            expect(screen.getByRole('button', { name: 'Edit mine.png' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Delete mine.png' })).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Edit theirs.png' })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Delete theirs.png' })).not.toBeInTheDocument();
        });

        it('draws update and delete independently', async () => {
            assetsState.assets = [asset(1, 'edit-only.png', { can_delete: false }), asset(2, 'delete-only.png', { can_update: false })];
            renderWithProviders(<AssetsList />);
            await screen.findByText('edit-only.png');

            expect(screen.getByRole('button', { name: 'Edit edit-only.png' })).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Delete edit-only.png' })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Edit delete-only.png' })).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Delete delete-only.png' })).toBeInTheDocument();
        });

        it('offers no View or Download for an asset the caller may not view, and shows the lock instead of requesting it', async () => {
            assetsState.assets = [asset(1, 'private.png', { can_view: false })];
            renderWithProviders(<AssetsList />);
            await screen.findByText('private.png');

            expect(screen.queryByRole('link', { name: /view private/i })).not.toBeInTheDocument();
            expect(screen.queryByRole('link', { name: /download private/i })).not.toBeInTheDocument();
            expect(screen.getByRole('img', { name: /no access/i })).toBeInTheDocument();
            expect(screen.queryByAltText('private.png')).not.toBeInTheDocument();
        });

        it('offers a bulk action only when it holds for every selected asset', async () => {
            assetsState.assets = [asset(1, 'mine.png'), asset(2, 'theirs.png', { can_update: false, can_delete: false })];
            const user = userEvent.setup();
            renderWithProviders(<AssetsList />);
            await screen.findByText('theirs.png');

            await user.click(screen.getByRole('checkbox', { name: 'Select mine.png' }));
            expect(screen.getByRole('button', { name: /add groups/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();

            await user.click(screen.getByRole('checkbox', { name: 'Select theirs.png' }));
            expect(screen.queryByRole('button', { name: /add groups/i })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /remove groups/i })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /move to folder/i })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
        });
    });
});
