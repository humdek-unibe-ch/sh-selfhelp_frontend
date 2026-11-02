/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';

/**
 * The asset list is a tree grouped by FOLDER (not by file type): the folder is
 * the unit that carries meaning now, since both the ACL grants and the
 * open-access flag are folder-scoped.
 */
const { hasPermission } = vi.hoisted(() => ({ hasPermission: vi.fn() }));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission }, user: null, isLoading: false, error: null }),
}));
vi.mock('../../../../../../hooks/useAssets', () => ({
    useAssets: () => ({
        data: {
            assets: [
                // Deliberately unsorted, and mixing types within one folder, so
                // the test proves folder grouping rather than type grouping.
                // Every row carries the REAL backend `asset_type` ('asset' — a
                // storage category, not a file format). Trusting it for the
                // type label made every row render as "Other".
                { id: 1, file_name: 'pedri.webp', asset_type: 'asset', file_path: 'uploads/assets/champ/pedri.webp', url: '/cms-api/v1/assets/champ/pedri.webp', folder: 'champ' },
                { id: 2, file_name: 'logo.svg', asset_type: 'asset', file_path: 'uploads/assets/general/logo.svg', url: '/cms-api/v1/assets/general/logo.svg', folder: 'general' },
                { id: 3, file_name: 'goal-reel.mp4', asset_type: 'asset', file_path: 'uploads/assets/champ/goal-reel.mp4', url: '/cms-api/v1/assets/champ/goal-reel.mp4', folder: 'champ' },
                { id: 4, file_name: 'loose.png', asset_type: 'asset', file_path: 'uploads/assets/loose.png', url: '/cms-api/v1/assets/loose.png', folder: null },
            ],
            pagination: { page: 1, pageSize: 100, total: 4, totalPages: 1 },
        },
        isLoading: false,
        error: null,
    }),
    useDeleteAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useAssetFolders: () => ({
        data: {
            folders: [
                { folder: 'champ', is_open_access: true },
                { folder: 'general', is_open_access: false },
            ],
        },
    }),
}));

import { AssetsList } from '../AssetsList';

/** The collapsible folder header button for a folder. */
const folderHeader = (name: string) =>
    screen.getByRole('button', { expanded: true, name: new RegExp(name, 'i') });

describe('AssetsList folder tree', () => {
    beforeEach(() => {
        hasPermission.mockReset();
        hasPermission.mockImplementation((p: string) => p === PERMISSIONS.ADMIN_ASSET_READ);
    });

    it('groups assets under their folder, not their file type', async () => {
        renderWithProviders(<AssetsList />);

        // champ holds an image AND a video — one group, because they share a folder.
        const champ = folderHeader('champ');
        expect(champ).toBeInTheDocument();
        expect(within(champ).getByText(/2 files/)).toBeInTheDocument();

        expect(within(folderHeader('general')).getByText(/1 file$/)).toBeInTheDocument();

        // No type-based group headers survive.
        expect(screen.queryByRole('button', { name: /^Images/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^Videos/ })).not.toBeInTheDocument();
    });

    it('groups folderless assets under Root', () => {
        renderWithProviders(<AssetsList />);
        expect(folderHeader('Root')).toBeInTheDocument();
        expect(screen.getByText('loose.png')).toBeInTheDocument();
    });

    it('badges a folder that is open to the public', () => {
        renderWithProviders(<AssetsList />);
        expect(within(folderHeader('champ')).getByText('Public')).toBeInTheDocument();
        expect(within(folderHeader('general')).queryByText('Public')).not.toBeInTheDocument();
    });

    it('collapses and expands a folder', () => {
        renderWithProviders(<AssetsList />);
        expect(screen.getByText('pedri.webp')).toBeVisible();

        fireEvent.click(folderHeader('champ'));

        // The champ header is now the collapsed one; the others stay expanded.
        const collapsed = screen.getAllByRole('button', { expanded: false });
        expect(collapsed).toHaveLength(1);
        expect(collapsed[0]).toHaveTextContent(/champ/i);

        fireEvent.click(collapsed[0]);
        expect(screen.queryByRole('button', { expanded: false })).not.toBeInTheDocument();
    });

    it('shows the per-row file type instead of repeating the folder', () => {
        renderWithProviders(<AssetsList />);
        // Folder is the group header, so the row column surfaces type instead.
        // One table per folder, hence a Type header per group and no Folder one.
        expect(screen.getAllByRole('columnheader', { name: /type/i })).toHaveLength(3);
        expect(screen.queryByRole('columnheader', { name: /folder/i })).not.toBeInTheDocument();
        // The Type column shows the concrete extension, not the category.
        expect(screen.getByText('MP4')).toBeInTheDocument();
    });
});
