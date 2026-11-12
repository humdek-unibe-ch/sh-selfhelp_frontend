/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';

/**
 * Access is per asset: the list shows who can see each asset (its groups,
 * `guest` as a plain group tag, none as Admins only), filters by group, and offers bulk
 * add/remove of groups for selected assets.
 */
const { hasPermission, useAssetsMock } = vi.hoisted(() => ({ hasPermission: vi.fn(), useAssetsMock: vi.fn() }));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission }, user: null, isLoading: false, error: null }),
}));
vi.mock('../../../../../../hooks/useGroups', () => ({
    useAllGroups: () => ({
        data: { groups: [{ id: 2, name: 'researcher' }, { id: 3, name: 'subject' }] },
        isLoading: false,
    }),
}));

const asset = (id: number, name: string | null, groups: { id: number; name: string }[]) => ({
    id,
    uuid: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
    name,
    url: `/cms-api/v1/assets/00000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
    mime_type: 'application/pdf',
    size: 1,
    alt: null,
    groups,
    can_view: true,
    can_update: true,
    can_delete: true,
    created_at: '2026-11-03T10:00:00+00:00',
    updated_at: '2026-11-03T10:00:00+00:00',
});

vi.mock('../../../../../../hooks/useAssets', () => ({
    useAssets: (params: unknown) => useAssetsMock(params),
    useDeleteAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useBulkAssetGroups: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useBulkDeleteAssets: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useBulkMoveAssets: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useAssetFolders: () => ({ data: [] }),
    useSaveAssetFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeleteAssetFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCreateAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCreateMultipleAssets: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpdateAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { AssetsList } from '../AssetsList';

describe('AssetsList access', () => {
    beforeEach(() => {
        hasPermission.mockReset();
        hasPermission.mockImplementation((p: string) => p === PERMISSIONS.ADMIN_ASSET_UPDATE || p === PERMISSIONS.ADMIN_ASSET_READ);
        useAssetsMock.mockReset();
        useAssetsMock.mockReturnValue({
            data: {
                assets: [
                    asset(1, 'public.pdf', []),
                    asset(2, 'shared.pdf', [{ id: 2, name: 'researcher' }, { id: 3, name: 'subject' }]),
                    asset(3, 'private.pdf', []),
                    asset(5, 'Team photo', []),
                    asset(6, null, []),
                ],
                pagination: { page: 1, pageSize: 100, total: 5, totalPages: 1 },
            },
            isLoading: false,
            error: null,
        });
    });

    it('shows who can see each asset', () => {
        renderWithProviders(<AssetsList folderId={null} onFolderChange={vi.fn()} />);

        const row = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;
        // No groups = public; otherwise one tag per group.
        expect(within(row('public.pdf')).getByText('Public')).toBeInTheDocument();
        expect(within(row('shared.pdf')).getByText('researcher')).toBeInTheDocument();
        expect(within(row('shared.pdf')).getByText('subject')).toBeInTheDocument();
        expect(screen.queryByText('Admins only')).not.toBeInTheDocument();
    });

    it('shows the name as the label with the uuid beneath it, and the uuid alone without a name', () => {
        renderWithProviders(<AssetsList folderId={null} onFolderChange={vi.fn()} />);

        const row = screen.getByText('Team photo').closest('tr') as HTMLElement;
        expect(within(row).getByText('00000000-0000-4000-8000-000000000005')).toBeInTheDocument();
        expect(within(row).getByRole('button', { name: 'Edit Team photo' })).toBeInTheDocument();

        const unnamed = screen.getByText('00000000-0000-4000-8000-000000000006').closest('tr') as HTMLElement;
        expect(within(unnamed).getAllByText('00000000-0000-4000-8000-000000000006')).toHaveLength(1);
    });

    it('filters the list by group once the filters are applied', async () => {
        renderWithProviders(<AssetsList folderId={null} onFolderChange={vi.fn()} />);

        fireEvent.click(screen.getByPlaceholderText('All groups'));
        fireEvent.click(await screen.findByRole('option', { name: 'subject' }));
        expect(useAssetsMock).not.toHaveBeenCalledWith(expect.objectContaining({ group_id: 3 }));

        fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));
        expect(useAssetsMock).toHaveBeenCalledWith(expect.objectContaining({ group_id: 3, page: 1 }));
    });

    it('offers bulk group actions for the selected assets', async () => {
        renderWithProviders(<AssetsList folderId={null} onFolderChange={vi.fn()} />);

        fireEvent.click(screen.getByRole('checkbox', { name: 'Select public.pdf' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'Select private.pdf' }));

        const bar = screen.getByRole('region', { name: 'Bulk actions' });
        expect(within(bar).getByText('2 assets selected')).toBeInTheDocument();

        fireEvent.click(within(bar).getByRole('button', { name: 'Add groups' }));
        expect(await screen.findByText('Share assets with groups')).toBeInTheDocument();
        expect(screen.getByText(/2 selected assets will be visible to members/)).toBeInTheDocument();
    });

    it.each([
        { selected: ['shared.pdf'], expected: ['researcher', 'subject'] },
        // A public asset shares no group with it: nothing to remove.
        { selected: ['shared.pdf', 'public.pdf'], expected: [] },
    ])('offers to remove only the groups every selected asset has ($selected)', async ({ selected, expected }) => {
        renderWithProviders(<AssetsList folderId={null} onFolderChange={vi.fn()} />);
        selected.forEach((name) => fireEvent.click(screen.getByRole('checkbox', { name: `Select ${name}` })));

        fireEvent.click(within(screen.getByRole('region', { name: 'Bulk actions' })).getByRole('button', { name: 'Remove groups' }));
        const dialog = await screen.findByRole('dialog');
        const input = within(dialog).getByPlaceholderText('Pick one or more groups');
        fireEvent.click(input);

        // The dialog's own dropdown (jsdom does not report it as visible).
        const listbox = document.getElementById(input.getAttribute('aria-controls') ?? '');
        const options = listbox ? within(listbox).queryAllByRole('option', { hidden: true }) : [];
        expect(options.map((option) => option.textContent)).toEqual(expected);
    });

    it('hides bulk group actions without admin.asset.update', () => {
        hasPermission.mockImplementation((p: string) => p === PERMISSIONS.ADMIN_ASSET_READ);
        renderWithProviders(<AssetsList folderId={null} onFolderChange={vi.fn()} />);

        fireEvent.click(screen.getByRole('checkbox', { name: 'Select public.pdf' }));

        const bar = screen.getByRole('region', { name: 'Bulk actions' });
        expect(within(bar).queryByRole('button', { name: 'Add groups' })).not.toBeInTheDocument();
    });
});
