/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, within, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';
import type { IAssetsListParams } from '../../../../../../api/admin/asset.api';

/**
 * The table is a folder browser: one folder at a time (subfolders on its
 * first page, then its assets, paged), breadcrumbs back up; search covers
 * every folder; the header counts every asset; bulk delete asks first.
 */
const { hasPermission, bulkDelete, bulkMove, requests } = vi.hoisted(() => ({
    hasPermission: vi.fn(),
    bulkDelete: vi.fn(),
    bulkMove: vi.fn(),
    requests: [] as IAssetsListParams[],
}));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission }, user: null, isLoading: false, error: null }),
}));
vi.mock('../../../../../../hooks/useGroups', () => ({
    useGroups: () => ({ data: { groups: [] }, isLoading: false }),
}));

const asset = (id: number, name: string, folderId: number | null) => ({
    id,
    uuid: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
    name,
    url: `/cms-api/v1/assets/00000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
    mime_type: 'application/pdf',
    size: 1,
    alt: null,
    folder_id: folderId,
    roles: [],
    groups: [],
    created_at: '2026-11-03T10:00:00+00:00',
    updated_at: '2026-11-03T10:00:00+00:00',
});

/** Fake backend: answers by folder_id (0 = no folder, absent = all folders). */
const listFor = (params: IAssetsListParams) => {
    if (params.pageSize === 1) {
        return { assets: [], pagination: { page: 1, pageSize: 1, total: 42, totalPages: 42 } };
    }
    const assets =
        params.folder_id === 0 ? [asset(1, 'qa-loose', null)]
        : params.folder_id === 10 ? [asset(2, 'qa-in-team', 10), asset(3, 'qa-in-team-2', 10)]
        : params.folder_id === undefined ? [asset(4, 'qa-found', 11)]
        : [];
    return { assets, pagination: { page: params.page ?? 1, pageSize: 20, total: 30, totalPages: 2 } };
};

vi.mock('../../../../../../hooks/useAssets', () => ({
    useAssets: (params: IAssetsListParams) => {
        requests.push(params);
        return { data: listFor(params), isLoading: false, isFetching: false, error: null, refetch: vi.fn() };
    },
    useAssetFolders: () => ({
        data: [
            { id: 10, name: 'Team', parent_id: null, asset_count: 2 },
            { id: 11, name: 'Photos', parent_id: 10, asset_count: 1 },
        ],
    }),
    useDeleteAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useBulkAssetGroups: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useBulkDeleteAssets: () => ({ mutateAsync: bulkDelete, isPending: false }),
    useBulkMoveAssets: () => ({ mutateAsync: bulkMove, isPending: false }),
    useSaveAssetFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeleteAssetFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCreateAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCreateMultipleAssets: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpdateAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { AssetsList } from '../AssetsList';

/** The page owns the open folder; this stands in for it. */
function Browser() {
    const [folderId, setFolderId] = useState<number | null>(null);
    return <AssetsList folderId={folderId} onFolderChange={setFolderId} />;
}

const lastListRequest = () => requests.filter((params) => params.pageSize !== 1).at(-1);

describe('AssetsList folder browser', () => {
    beforeEach(() => {
        requests.length = 0;
        hasPermission.mockReset().mockReturnValue(true);
        bulkDelete.mockReset().mockResolvedValue({ deleted: 2 });
        bulkMove.mockReset().mockResolvedValue({ moved: 2 });
    });

    it('shows the top level: its folders with their contents, then only assets in no folder', () => {
        renderWithProviders(<Browser />);

        expect(screen.getByRole('button', { name: 'Open folder Team' })).toHaveTextContent('1 folder · 2 assets');
        expect(screen.queryByRole('button', { name: 'Open folder Photos' })).not.toBeInTheDocument();
        expect(screen.getByText('qa-loose')).toBeInTheDocument();
        expect(lastListRequest()).toMatchObject({ folder_id: 0, page: 1, pageSize: 20 });
    });

    it('opens a folder and goes back up through the breadcrumbs', () => {
        renderWithProviders(<Browser />);

        fireEvent.click(screen.getByRole('button', { name: 'Open folder Team' }));

        expect(lastListRequest()).toMatchObject({ folder_id: 10 });
        expect(screen.getByText('qa-in-team')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Open folder Photos' })).toBeInTheDocument();
        expect(within(screen.getByRole('navigation', { name: 'Folder path' })).getByText('Team')).toHaveAttribute('aria-current', 'location');

        fireEvent.click(screen.getByRole('button', { name: /All assets/ }));

        expect(lastListRequest()).toMatchObject({ folder_id: 0 });
        expect(screen.getByText('qa-loose')).toBeInTheDocument();
    });

    it('lists subfolders on the first page only', () => {
        renderWithProviders(<Browser />);

        fireEvent.click(screen.getByRole('button', { name: '2' }));

        expect(lastListRequest()).toMatchObject({ folder_id: 0, page: 2 });
        expect(screen.queryByRole('button', { name: 'Open folder Team' })).not.toBeInTheDocument();
    });

    it('searches every folder and shows where each result lives', () => {
        renderWithProviders(<Browser />);

        fireEvent.change(screen.getByRole('textbox', { name: 'Search assets' }), { target: { value: 'found' } });
        fireEvent.click(screen.getByRole('button', { name: /Apply/ }));

        expect(lastListRequest()).toMatchObject({ search: 'found', folder_id: undefined });
        expect(screen.getByText('qa-found')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Team / Photos' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Open folder Team' })).not.toBeInTheDocument();
    });

    it('counts every asset in the header, whatever folder is open', () => {
        renderWithProviders(<Browser />);

        fireEvent.click(screen.getByRole('button', { name: 'Open folder Team' }));

        expect(screen.getByLabelText('42 assets')).toHaveTextContent('42');
    });

    it('deletes the selected assets after confirming', async () => {
        renderWithProviders(<Browser />);
        fireEvent.click(screen.getByRole('button', { name: 'Open folder Team' }));

        fireEvent.click(screen.getByRole('checkbox', { name: 'Select all assets on this page' }));
        fireEvent.click(within(screen.getByRole('region', { name: 'Bulk actions' })).getByRole('button', { name: /Delete/ }));
        const dialog = await screen.findByRole('dialog');
        fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(bulkDelete).toHaveBeenCalledWith([2, 3]));
    });

    it('moves the selected assets to the folder picked, starting from the open one', async () => {
        renderWithProviders(<Browser />);
        fireEvent.click(screen.getByRole('button', { name: 'Open folder Team' }));

        fireEvent.click(screen.getByRole('checkbox', { name: 'Select all assets on this page' }));
        fireEvent.click(within(screen.getByRole('region', { name: 'Bulk actions' })).getByRole('button', { name: /Move to folder/ }));
        const dialog = await screen.findByRole('dialog');
        const picker = within(dialog).getByLabelText('Move to');
        expect(picker).toHaveValue('Team');

        fireEvent.click(picker);
        const listbox = document.getElementById(picker.getAttribute('aria-controls') ?? '');
        fireEvent.click(within(listbox as HTMLElement).getByRole('option', { name: 'Team / Photos', hidden: true }));
        fireEvent.click(within(dialog).getByRole('button', { name: 'Move' }));

        await waitFor(() => expect(bulkMove).toHaveBeenCalledWith({ assetIds: [2, 3], folderId: 11 }));
    });

    it('hides bulk delete without admin.asset.delete', () => {
        hasPermission.mockImplementation((p: string) => p !== PERMISSIONS.ADMIN_ASSET_DELETE);
        renderWithProviders(<Browser />);

        fireEvent.click(screen.getByRole('checkbox', { name: 'Select qa-loose' }));

        expect(within(screen.getByRole('region', { name: 'Bulk actions' })).queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
    });
});
