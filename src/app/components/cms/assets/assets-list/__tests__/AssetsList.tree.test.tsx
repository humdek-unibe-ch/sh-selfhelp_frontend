/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';
import type { IAssetFolder, IAssetsListParams } from '../../../../../../api/admin/asset.api';

/**
 * The table is a folder tree: folders open in place (several at once), a
 * folder's assets are asked for the first time it opens, and every folder
 * action (rename, move, delete) is in the folder's own menu. Search replaces the
 * tree with flat results; the bulk bar works on assets from every open folder.
 */
const { hasPermission, mocks, requests } = vi.hoisted(() => ({
    hasPermission: vi.fn(),
    mocks: {
        saveFolder: vi.fn(),
        deleteFolder: vi.fn(),
        bulkMove: vi.fn(),
        bulkDelete: vi.fn(),
        bulkGroups: vi.fn(),
        notify: vi.fn(),
    },
    requests: [] as IAssetsListParams[],
}));

vi.mock('@mantine/notifications', () => ({ notifications: { show: mocks.notify } }));
vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission }, user: null, isLoading: false, error: null }),
}));
vi.mock('../../../../../../hooks/useGroups', () => ({
    useAllGroups: () => ({ data: { groups: [{ id: 1, name: 'Editors' }] }, isLoading: false }),
}));

const asset = (id: number, name: string, folderId: number | null, overrides: Record<string, unknown> = {}) => ({
    id,
    uuid: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
    name,
    url: `/cms-api/v1/assets/00000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
    mime_type: 'application/pdf',
    extension: 'pdf',
    file_name: `${name}-00000000-0000-4000-8000-${String(id).padStart(12, '0')}.pdf`,
    size: 1,
    alt: null,
    folder_id: folderId,
    roles: [],
    groups: [],
    can_view: true,
    can_update: true,
    can_delete: true,
    created_at: '2026-11-03T10:00:00+00:00',
    updated_at: '2026-11-03T10:00:00+00:00',
    ...overrides,
});

const FOLDERS: IAssetFolder[] = [
    { id: 10, name: 'Team', parent_id: null, asset_count: 2, subtree_asset_count: 3 },
    { id: 11, name: 'Photos', parent_id: 10, asset_count: 1, subtree_asset_count: 1 },
    { id: 12, name: 'Courses', parent_id: null, asset_count: 0, subtree_asset_count: 0 },
];

/** Fake backend: answers by folder_id (0 = no folder, absent = every folder). */
const listFor = (params: IAssetsListParams) => {
    if (params.pageSize === 1) {
        return { assets: [], pagination: { page: 1, pageSize: 1, total: 42, totalPages: 42 } };
    }
    const page = params.page ?? 1;
    if (params.folder_id === 10) {
        return page === 1
            ? { assets: [asset(2, 'qa-in-team', 10), asset(3, 'qa-private', 10, { can_delete: false })], pagination: { page, pageSize: 50, total: 3, totalPages: 2 } }
            : { assets: [asset(5, 'qa-in-team-3', 10)], pagination: { page, pageSize: 50, total: 3, totalPages: 2 } };
    }
    const assets =
        params.folder_id === 0 ? [asset(1, 'qa-loose', null)]
        : params.folder_id === 11 ? [asset(4, 'qa-in-photos', 11)]
        : params.folder_id === undefined ? [asset(4, 'qa-found', 11)]
        : [];
    return { assets, pagination: { page, pageSize: params.pageSize ?? 20, total: assets.length, totalPages: 1 } };
};

vi.mock('../../../../../../hooks/useAssets', () => ({
    useAssets: (params: IAssetsListParams) => {
        requests.push(params);
        return { data: listFor(params), isLoading: false, isFetching: false, error: null, refetch: vi.fn() };
    },
    useAssetFolders: () => ({ data: FOLDERS }),
    useDeleteAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useBulkAssetGroups: () => ({ mutateAsync: mocks.bulkGroups, isPending: false }),
    useBulkDeleteAssets: () => ({ mutateAsync: mocks.bulkDelete, isPending: false }),
    useBulkMoveAssets: () => ({ mutateAsync: mocks.bulkMove, isPending: false }),
    useSaveAssetFolder: () => ({ mutateAsync: mocks.saveFolder, isPending: false }),
    useDeleteAssetFolder: () => ({ mutateAsync: mocks.deleteFolder, isPending: false }),
    useSetAssetFolderAccess: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCreateAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpdateAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { AssetsList } from '../AssetsList';

// jsdom has no layout, so it lacks scrollIntoView, which Mantine's option lists call.
Element.prototype.scrollIntoView = vi.fn();

const requestedFolders = () => requests.map((params) => params.folder_id);
const toggle = (name: string) => screen.getByRole('button', { name: `Toggle folder ${name}` });
const openMenu = async (name: string) => {
    await userEvent.click(screen.getByRole('button', { name: `Actions for folder ${name}` }));
};
// jsdom has no layout and Mantine's menu stays `display: none` while it fades in, so menu items are found as hidden.
const menuItem = (name: string) => screen.findByRole('menuitem', { name, hidden: true });
const menuItemNames = () => screen.queryAllByRole('menuitem', { hidden: true }).map((item) => item.textContent);
/** A server refusal, shaped like the one axios rejects with. */
const refusal = (status: number, error: string) => ({ response: { status, data: { error } } });

describe('AssetsList folder tree', () => {
    beforeEach(() => {
        requests.length = 0;
        hasPermission.mockReset().mockReturnValue(true);
        mocks.saveFolder.mockReset().mockResolvedValue(FOLDERS);
        mocks.deleteFolder.mockReset().mockResolvedValue(FOLDERS);
        mocks.bulkMove.mockReset().mockResolvedValue({ moved: 1 });
        mocks.bulkDelete.mockReset().mockResolvedValue({ deleted: 1 });
        mocks.bulkGroups.mockReset().mockResolvedValue({ updated: 1 });
        mocks.notify.mockReset();
    });

    describe('opening folders', () => {
        it('lists the top-level folders with what they hold, then the assets in no folder', () => {
            renderWithProviders(<AssetsList />);

            expect(screen.getByText('Team')).toBeInTheDocument();
            expect(screen.getByText('1 folder · 3 assets')).toBeInTheDocument();
            expect(screen.getByText('0 assets')).toBeInTheDocument();
            expect(screen.getByText('qa-loose')).toBeInTheDocument();
            // Subfolders and the assets of folders appear only inside an open folder.
            expect(screen.queryByText('Photos')).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /Folders$/ })).not.toBeInTheDocument();
            expect(screen.queryByRole('navigation', { name: 'Folder path' })).not.toBeInTheDocument();
        });

        it('asks for the assets of a folder only when it is first opened, and opens several folders at once', async () => {
            renderWithProviders(<AssetsList />);
            expect(requestedFolders()).not.toContain(10);
            expect(toggle('Team')).toHaveAttribute('aria-expanded', 'false');

            await userEvent.click(toggle('Team'));

            expect(toggle('Team')).toHaveAttribute('aria-expanded', 'true');
            expect(requests).toContainEqual({ page: 1, pageSize: 50, folder_id: 10 });
            expect(screen.getByText('qa-in-team')).toBeInTheDocument();
            expect(screen.getByText('Photos')).toBeInTheDocument();
            // Photos is a folder of its own: closed until opened.
            expect(requestedFolders()).not.toContain(11);

            await userEvent.click(toggle('Photos'));
            expect(screen.getByText('qa-in-photos')).toBeInTheDocument();
            expect(screen.getByText('qa-in-team')).toBeInTheDocument();
            expect(toggle('Team')).toHaveAttribute('aria-expanded', 'true');
        });

        it('opens and closes with the keyboard and with a click on the row', async () => {
            renderWithProviders(<AssetsList />);

            toggle('Team').focus();
            await userEvent.keyboard('{Enter}');
            expect(toggle('Team')).toHaveAttribute('aria-expanded', 'true');
            await userEvent.keyboard(' ');
            expect(toggle('Team')).toHaveAttribute('aria-expanded', 'false');
            expect(screen.queryByText('qa-in-team')).not.toBeInTheDocument();

            await userEvent.click(screen.getByText('Team'));
            expect(toggle('Team')).toHaveAttribute('aria-expanded', 'true');
            await userEvent.click(screen.getByText('Team'));
            expect(toggle('Team')).toHaveAttribute('aria-expanded', 'false');
        });

        it('says an empty folder is empty', async () => {
            renderWithProviders(<AssetsList />);

            await userEvent.click(toggle('Courses'));

            expect(screen.getByText('This folder is empty')).toBeInTheDocument();
        });

        it('shows 50 assets of a folder at a time and a "Show more" row for the rest', async () => {
            renderWithProviders(<AssetsList />);
            await userEvent.click(toggle('Team'));
            expect(screen.queryByText('qa-in-team-3')).not.toBeInTheDocument();

            await userEvent.click(screen.getByRole('button', { name: /Show more/ }));

            expect(requests).toContainEqual({ page: 2, pageSize: 50, folder_id: 10 });
            expect(screen.getByText('qa-in-team-3')).toBeInTheDocument();
        });
    });

    describe('searching', () => {
        it('shows flat results from every folder, and the folder link leaves the search and opens the path', async () => {
            renderWithProviders(<AssetsList />);

            fireEvent.change(screen.getByRole('textbox', { name: 'Search assets' }), { target: { value: 'found' } });
            fireEvent.click(screen.getByRole('button', { name: /Apply/ }));

            expect(requests.filter((params) => params.pageSize !== 1).at(-1)).toMatchObject({ search: 'found', folder_id: undefined });
            expect(screen.getByText('qa-found')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Toggle folder Team' })).not.toBeInTheDocument();

            await userEvent.click(screen.getByRole('button', { name: 'Team / Photos' }));

            expect(toggle('Team')).toHaveAttribute('aria-expanded', 'true');
            expect(toggle('Photos')).toHaveAttribute('aria-expanded', 'true');
            expect(screen.getByText('qa-in-photos')).toBeInTheDocument();
        });

        it('counts every asset in the header', () => {
            renderWithProviders(<AssetsList />);

            expect(screen.getByLabelText('42 assets')).toHaveTextContent('42');
        });
    });

    describe('renaming a folder in place', () => {
        it('saves the new name with Enter', async () => {
            renderWithProviders(<AssetsList />);

            await openMenu('Team');
            await userEvent.click(await menuItem('Rename'));
            const input = screen.getByRole('textbox', { name: 'Name of folder Team' });
            await userEvent.clear(input);
            await userEvent.type(input, 'Staff{Enter}');

            await waitFor(() => expect(mocks.saveFolder).toHaveBeenCalledWith({ folder: { name: 'Staff', parent_id: null }, folderId: 10 }));
            await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Name of folder Team' })).not.toBeInTheDocument());
        });

        it('keeps the input open and shows the server message when a sibling has the name', async () => {
            mocks.saveFolder.mockRejectedValue(refusal(409, 'A folder named "Courses" already exists here.'));
            renderWithProviders(<AssetsList />);

            await openMenu('Team');
            await userEvent.click(await menuItem('Rename'));
            const input = screen.getByRole('textbox', { name: 'Name of folder Team' });
            await userEvent.clear(input);
            await userEvent.type(input, 'courses{Enter}');

            expect(await screen.findByText('A folder named "Courses" already exists here.')).toBeInTheDocument();
            expect(screen.getByRole('textbox', { name: 'Name of folder Team' })).toHaveValue('courses');
        });

        it('cancels with Escape without saving', async () => {
            renderWithProviders(<AssetsList />);

            await openMenu('Team');
            await userEvent.click(await menuItem('Rename'));
            await userEvent.type(screen.getByRole('textbox', { name: 'Name of folder Team' }), 'x{Escape}');

            expect(screen.queryByRole('textbox', { name: /Name of folder/ })).not.toBeInTheDocument();
            expect(mocks.saveFolder).not.toHaveBeenCalled();
        });
    });

    describe('creating folders', () => {
        it('"New folder" names a top-level folder in a row of the table', async () => {
            renderWithProviders(<AssetsList />);

            await userEvent.click(screen.getByRole('button', { name: 'New folder' }));
            await userEvent.type(screen.getByRole('textbox', { name: 'Name of the new folder' }), 'Archive{Enter}');

            await waitFor(() => expect(mocks.saveFolder).toHaveBeenCalledWith({ folder: { name: 'Archive', parent_id: null } }));
        });

        it('"New subfolder" opens the folder and names the subfolder inside it', async () => {
            renderWithProviders(<AssetsList />);

            await openMenu('Courses');
            await userEvent.click(await menuItem('New subfolder'));
            await userEvent.type(screen.getByRole('textbox', { name: 'Name of the new folder' }), 'Week 1{Enter}');

            await waitFor(() => expect(mocks.saveFolder).toHaveBeenCalledWith({ folder: { name: 'Week 1', parent_id: 12 } }));
            expect(toggle('Courses')).toHaveAttribute('aria-expanded', 'true');
        });

        it('"Upload here" asks the page to open the upload form on that folder', async () => {
            const onUploadToFolder = vi.fn();
            renderWithProviders(<AssetsList onUploadToFolder={onUploadToFolder} />);

            await openMenu('Team');
            await userEvent.click(await menuItem('Upload here'));

            expect(onUploadToFolder).toHaveBeenCalledWith(10);
        });
    });

    describe('moving', () => {
        it('moves a folder to the folder picked and does not offer the folder or its subfolders', async () => {
            renderWithProviders(<AssetsList />);

            await openMenu('Team');
            await userEvent.click(await menuItem('Move to...'));
            const dialog = await screen.findByRole('dialog');
            const picker = within(dialog).getByLabelText('Move to');
            await userEvent.click(picker);
            const listbox = document.getElementById(picker.getAttribute('aria-controls') ?? '') as HTMLElement;
            const offered = within(listbox).getAllByRole('option', { hidden: true }).map((option) => option.textContent);

            expect(offered).toEqual(['No folder (top level)', 'Courses']);
            await userEvent.click(within(listbox).getByRole('option', { name: 'Courses', hidden: true }));
            await userEvent.click(within(dialog).getByRole('button', { name: 'Move' }));

            await waitFor(() => expect(mocks.saveFolder).toHaveBeenCalledWith({ folder: { name: 'Team', parent_id: 12 }, folderId: 10 }));
        });

        it('moves a folder to the top level with "No folder"', async () => {
            renderWithProviders(<AssetsList />);

            await openMenu('Photos').catch(() => undefined);
            await userEvent.click(toggle('Team'));
            await openMenu('Photos');
            await userEvent.click(await menuItem('Move to...'));
            const dialog = await screen.findByRole('dialog');
            const picker = within(dialog).getByLabelText('Move to');
            await userEvent.click(picker);
            const listbox = document.getElementById(picker.getAttribute('aria-controls') ?? '') as HTMLElement;
            await userEvent.click(within(listbox).getByRole('option', { name: 'No folder (top level)', hidden: true }));
            await userEvent.click(within(dialog).getByRole('button', { name: 'Move' }));

            await waitFor(() => expect(mocks.saveFolder).toHaveBeenCalledWith({ folder: { name: 'Photos', parent_id: null }, folderId: 11 }));
        });

        it('still moves the selected assets from the bulk bar, to the folder picked', async () => {
            renderWithProviders(<AssetsList />);

            await userEvent.click(screen.getByRole('checkbox', { name: 'Select qa-loose' }));
            await userEvent.click(within(screen.getByRole('region', { name: 'Bulk actions' })).getByRole('button', { name: /Move to folder/ }));
            const dialog = await screen.findByRole('dialog');
            const picker = within(dialog).getByLabelText('Move to');
            await userEvent.click(picker);
            const listbox = document.getElementById(picker.getAttribute('aria-controls') ?? '') as HTMLElement;
            await userEvent.click(within(listbox).getByRole('option', { name: 'Team / Photos', hidden: true }));
            await userEvent.click(within(dialog).getByRole('button', { name: 'Move' }));

            await waitFor(() => expect(mocks.bulkMove).toHaveBeenCalledWith({ assetIds: [1], folderId: 11 }));
        });
    });

    describe('deleting a folder', () => {
        it('cannot delete a folder with content and says why', async () => {
            renderWithProviders(<AssetsList />);

            await openMenu('Team');

            const item = await menuItem('Delete');
            expect(item).toHaveAttribute('data-disabled', 'true');
            await userEvent.click(item);
            expect(mocks.deleteFolder).not.toHaveBeenCalled();
            await userEvent.hover(item.parentElement as HTMLElement);
            expect(await screen.findByText('Move or delete its content first')).toBeInTheDocument();
        });

        it('deletes an empty folder after confirming', async () => {
            renderWithProviders(<AssetsList />);

            await openMenu('Courses');
            const item = await menuItem('Delete');
            expect(item).not.toHaveAttribute('data-disabled');
            await userEvent.click(item);
            const dialog = await screen.findByRole('dialog');
            expect(mocks.deleteFolder).not.toHaveBeenCalled();
            await userEvent.click(within(dialog).getByRole('button', { name: 'Delete folder' }));

            await waitFor(() => expect(mocks.deleteFolder).toHaveBeenCalledWith(12));
        });

        it('shows the server message when it refuses (the folder holds assets this user cannot see)', async () => {
            mocks.deleteFolder.mockRejectedValue(refusal(409, 'The folder is not empty.'));
            renderWithProviders(<AssetsList />);

            await openMenu('Courses');
            await userEvent.click(await menuItem('Delete'));
            const dialog = await screen.findByRole('dialog');
            await userEvent.click(within(dialog).getByRole('button', { name: 'Delete folder' }));

            expect(await within(dialog).findByText('The folder is not empty.')).toBeInTheDocument();
        });
    });

    describe('permissions', () => {
        it('shows only the folder actions the caller may use', async () => {
            hasPermission.mockImplementation((permission: string) => permission === PERMISSIONS.ADMIN_ASSET_UPDATE);
            renderWithProviders(<AssetsList />);

            expect(screen.queryByRole('button', { name: 'New folder' })).not.toBeInTheDocument();
            await openMenu('Courses');

            await menuItem('Rename');
            expect(menuItemNames()).toEqual(['Rename', 'Move to...', 'Set access...']);
        });

        it('has no folder menu for a reader', () => {
            hasPermission.mockReturnValue(false);
            renderWithProviders(<AssetsList />);

            expect(screen.queryByRole('button', { name: /Actions for folder/ })).not.toBeInTheDocument();
        });
    });

    describe('bulk actions across open folders', () => {
        it('works the bulk rights out from every selected asset, whichever folder it is in', async () => {
            renderWithProviders(<AssetsList />);
            await userEvent.click(toggle('Team'));

            await userEvent.click(screen.getByRole('checkbox', { name: 'Select qa-loose' }));
            const bar = screen.getByRole('region', { name: 'Bulk actions' });
            expect(within(bar).getByRole('button', { name: 'Delete' })).toBeInTheDocument();

            // qa-private (in the open folder, on no page of the top level) may not be deleted by this caller.
            await userEvent.click(screen.getByRole('checkbox', { name: 'Select qa-private' }));

            expect(within(bar).getByText('2 assets selected')).toBeInTheDocument();
            expect(within(bar).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
            expect(within(bar).getByRole('button', { name: /Move to folder/ })).toBeInTheDocument();
        });

        it('deletes the selected assets after confirming', async () => {
            renderWithProviders(<AssetsList />);
            await userEvent.click(toggle('Team'));

            await userEvent.click(screen.getByRole('checkbox', { name: 'Select qa-in-team' }));
            await userEvent.click(screen.getByRole('checkbox', { name: 'Select qa-loose' }));
            await userEvent.click(within(screen.getByRole('region', { name: 'Bulk actions' })).getByRole('button', { name: 'Delete' }));
            const dialog = await screen.findByRole('dialog');
            await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

            await waitFor(() => expect(mocks.bulkDelete).toHaveBeenCalledWith([2, 1]));
        });

        // The selection keeps the assets as they were when ticked, so after a group
        // change the bulk bar must not go on offering what those old copies say.
        it('clears the selection after groups were added, so nothing is offered from the old groups', async () => {
            renderWithProviders(<AssetsList />);
            await userEvent.click(screen.getByRole('checkbox', { name: 'Select qa-loose' }));
            await userEvent.click(within(screen.getByRole('region', { name: 'Bulk actions' })).getByRole('button', { name: 'Add groups' }));

            const dialog = await screen.findByRole('dialog');
            await userEvent.click(within(dialog).getByPlaceholderText('Pick one or more groups'));
            // The filter card has a group select with the same option; the one just opened is the last.
            await userEvent.click((await screen.findAllByRole('option', { name: 'Editors', hidden: true })).at(-1)!);
            await userEvent.click(within(dialog).getByRole('button', { name: 'Add groups' }));

            await waitFor(() => expect(mocks.bulkGroups).toHaveBeenCalledWith({ asset_ids: [1], group_ids: [1], mode: 'add' }));
            await waitFor(() => expect(screen.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument());
            expect(screen.getByRole('checkbox', { name: 'Select qa-loose' })).not.toBeChecked();
        });

        it('keeps the selection when the group change fails', async () => {
            mocks.bulkGroups.mockRejectedValue(refusal(403, 'Not allowed'));
            renderWithProviders(<AssetsList />);
            await userEvent.click(screen.getByRole('checkbox', { name: 'Select qa-loose' }));
            await userEvent.click(within(screen.getByRole('region', { name: 'Bulk actions' })).getByRole('button', { name: 'Add groups' }));

            const dialog = await screen.findByRole('dialog');
            await userEvent.click(within(dialog).getByPlaceholderText('Pick one or more groups'));
            // The filter card has a group select with the same option; the one just opened is the last.
            await userEvent.click((await screen.findAllByRole('option', { name: 'Editors', hidden: true })).at(-1)!);
            await userEvent.click(within(dialog).getByRole('button', { name: 'Add groups' }));

            await waitFor(() => expect(mocks.notify).toHaveBeenCalled());
            expect(screen.getByRole('region', { name: 'Bulk actions' })).toBeInTheDocument();
        });

        it('clears the selection when the filters change', async () => {
            renderWithProviders(<AssetsList />);
            await userEvent.click(screen.getByRole('checkbox', { name: 'Select qa-loose' }));
            expect(screen.getByRole('region', { name: 'Bulk actions' })).toBeInTheDocument();

            fireEvent.change(screen.getByRole('textbox', { name: 'Search assets' }), { target: { value: 'found' } });
            fireEvent.click(screen.getByRole('button', { name: /Apply/ }));

            expect(screen.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument();
        });
    });
});
