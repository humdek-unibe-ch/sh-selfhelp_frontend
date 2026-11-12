/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { AdminAssetApi, type IAsset, type IAssetFolder } from '../../../../../../api/admin/asset.api';

/**
 * One modal uploads and edits assets. Upload is a table: every file has its own
 * name and alt text and goes up in its own request; a failed file stays for a
 * retry; the same file twice is listed once; a folder path that does not exist
 * is created, top down, only when the upload starts; an identical file already
 * in the library is reported. New uploads are public (no groups) and say so,
 * and are managed by the uploader's roles unless roles are picked. Editing sends
 * a changed folder and alt, a dropped file replaces the bytes of the SAME asset,
 * and the groups and roles are sent ONLY when the admin changed them (the
 * backend replaces the whole set when the field is present).
 */
const { createMock, updateMock, saveFolderMock, notify, state } = vi.hoisted(() => ({
    createMock: vi.fn(),
    updateMock: vi.fn(),
    saveFolderMock: vi.fn(),
    notify: vi.fn(),
    state: {
        folders: [] as { id: number; name: string; parent_id: number | null; asset_count: number }[],
        groups: {} as { data?: { groups: { id: number; name: string }[] }; isLoading?: boolean; isError?: boolean },
        roles: {} as { data?: { roles: { id: number; name: string }[] }; isLoading?: boolean; isError?: boolean },
        callerRoles: [] as { id: number; name: string; description: null }[],
    },
}));

vi.mock('@mantine/notifications', () => ({ notifications: { show: notify } }));
vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ user: { roles: state.callerRoles }, permissionChecker: null, isLoading: false, error: null }),
}));
vi.mock('../../../../../../hooks/useGroups', () => ({
    useAllGroups: () => state.groups,
}));
vi.mock('../../../../../../hooks/useRoles', () => ({
    useAllRoles: () => state.roles,
}));
vi.mock('../../../../../../hooks/useAssets', () => ({
    useCreateAsset: () => ({ mutateAsync: createMock, isPending: false }),
    useUpdateAsset: () => ({ mutateAsync: updateMock, isPending: false }),
    useSaveAssetFolder: () => ({ mutateAsync: saveFolderMock, isPending: false }),
    useAssetFolders: () => ({ data: state.folders }),
}));

import { AssetFormModal } from '../AssetFormModal';

const existing: IAsset = {
    id: 7,
    uuid: '22222222-2222-4222-8222-222222222222',
    name: 'team',
    url: '/cms-api/v1/assets/22222222-2222-4222-8222-222222222222',
    mime_type: 'image/png',
    extension: 'png',
    size: 100,
    alt: 'The team',
    groups: [{ id: 3, name: 'subject' }],
    folder_id: 10,
    roles: [{ id: 5, name: 'qa_researcher' }],
    can_view: true,
    can_update: true,
    can_delete: true,
    created_at: '2026-11-03T10:00:00+00:00',
    updated_at: '2026-11-03T10:00:00+00:00',
};

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;

/** A file with a fixed modified time, so the same name and size can be told apart or equal. */
const png = (name: string, content = 'x', lastModified = 1_000) => new File([content], name, { type: 'image/png', lastModified });

/** The picker's search field. (The label also names the open list, so a text query finds two elements.) */
const picker = (label: RegExp) => screen.getByRole('combobox', { name: label });

/** An option of an open list. (jsdom has no layout, so Mantine's dropdown stays `display: none`.) */
const option = (name: string) => screen.findByRole('option', { name, hidden: true });

/** What the picker shows as selected, in order. */
const selectedIn = (label: RegExp): string[] =>
    Array.from(picker(label).closest('.mantine-MultiSelect-root')?.querySelectorAll('.mantine-Pill-label') ?? []).map(
        (pill) => pill.textContent ?? '',
    );

/** Picks a folder path in the folder combobox: types it, then clicks the option offered. */
async function chooseFolder(text: string, optionName: string) {
    const field = picker(/^Folder/);
    await userEvent.click(field);
    await userEvent.clear(field);
    await userEvent.type(field, text);
    await userEvent.click(await option(optionName));
}

describe('AssetFormModal', () => {
    beforeEach(() => {
        Element.prototype.scrollIntoView = vi.fn();
        createMock.mockReset().mockResolvedValue({});
        updateMock.mockReset().mockResolvedValue({});
        notify.mockReset();
        state.folders = [{ id: 10, name: 'Team', parent_id: null, asset_count: 1 }];
        // Creating a folder answers with the whole list, as the server does.
        saveFolderMock.mockReset().mockImplementation(async ({ folder }: { folder: { name: string; parent_id: number | null } }) => {
            const created = { id: 100 + state.folders.length, name: folder.name, parent_id: folder.parent_id, asset_count: 0 };
            state.folders = [...state.folders, created];
            return state.folders;
        });
        state.groups = {
            data: { groups: [{ id: 2, name: 'researcher' }, { id: 3, name: 'subject' }] },
            isLoading: false,
        };
        state.roles = {
            data: { roles: [{ id: 1, name: 'admin' }, { id: 5, name: 'qa_researcher' }, { id: 6, name: 'qa_editor' }] },
            isLoading: false,
        };
        state.callerRoles = [{ id: 5, name: 'qa_researcher', description: null }];
    });

    describe('uploading', () => {
        it('uploads a new file as public, managed by the uploader, and warns that it is public', async () => {
            const onClose = vi.fn();
            renderWithProviders(<AssetFormModal opened onClose={onClose} />);

            const upload = await screen.findByRole('button', { name: 'Upload asset' });
            expect(upload).toBeDisabled();
            expect(screen.getByText('THIS ASSET IS PUBLIC')).toBeInTheDocument();

            await userEvent.upload(fileInput(), png('photo.png'));
            // The name starts as the file name without its extension.
            expect(screen.getByLabelText('Name of photo.png')).toHaveValue('photo');
            fireEvent.change(screen.getByLabelText('Alt text of photo.png'), { target: { value: 'A photo' } });
            fireEvent.click(screen.getByRole('button', { name: 'Upload asset' }));

            await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
            const payload = createMock.mock.calls[0][0];
            expect(payload.file.name).toBe('photo.png');
            expect(payload.name).toBe('photo');
            expect(payload.alt).toBe('A photo');
            expect(payload.group_ids).toEqual([]);
            // No roles picked: omitted, so the backend grants the uploader's roles.
            expect(payload.role_ids).toBeUndefined();
            expect(payload.folder_id).toBeNull();
            await waitFor(() => expect(onClose).toHaveBeenCalled());
            expect(saveFolderMock).not.toHaveBeenCalled();
        });

        it('takes alt text only for images', async () => {
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} />);

            await userEvent.upload(fileInput(), new File(['a,b'], 'table.csv', { type: 'text/csv', lastModified: 1 }));

            expect(screen.getByLabelText('Name of table.csv')).toHaveValue('table');
            expect(screen.queryByLabelText('Alt text of table.csv')).not.toBeInTheDocument();
        });

        it('opens on the folder it is given', async () => {
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} defaultFolderId={10} />);

            await userEvent.upload(fileInput(), png('photo.png'));
            fireEvent.click(screen.getByRole('button', { name: 'Upload asset' }));

            await waitFor(() => expect(createMock).toHaveBeenCalled());
            expect(createMock.mock.calls[0][0].folder_id).toBe(10);
        });

        it('lists the same file once when it is dropped twice, and names it in a notice', async () => {
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} />);

            await userEvent.upload(fileInput(), png('photo.png'));
            await userEvent.upload(fileInput(), png('photo.png'));

            expect(screen.getAllByLabelText('Name of photo.png')).toHaveLength(1);
            expect(notify).toHaveBeenCalledWith(expect.objectContaining({ title: 'Already in the list', message: expect.stringContaining('photo.png') }));
            // A file with the same name but other content (or modified time) is another file.
            await userEvent.upload(fileInput(), png('photo.png', 'different', 2_000));
            expect(screen.getAllByLabelText('Name of photo.png')).toHaveLength(2);
        });

        it('sends one request per file, each with its own name, and keeps a failed file for a retry', async () => {
            createMock.mockImplementation(async ({ file }: { file: File }) => {
                if (file.name === 'b.png') throw { response: { status: 400, data: { error: 'The file content does not match its extension.' } } };
                return {};
            });
            const onClose = vi.fn();
            renderWithProviders(<AssetFormModal opened onClose={onClose} />);

            await userEvent.upload(fileInput(), [png('a.png', 'a'), png('b.png', 'bb'), png('c.png', 'ccc')]);
            fireEvent.change(screen.getByLabelText('Name of c.png'), { target: { value: 'Third' } });
            fireEvent.click(screen.getByRole('button', { name: 'Upload 3 assets' }));

            await waitFor(() => expect(createMock).toHaveBeenCalledTimes(3));
            expect(createMock.mock.calls.map(([payload]) => [payload.file.name, payload.name])).toEqual([
                ['a.png', 'a'],
                ['b.png', 'b'],
                ['c.png', 'Third'],
            ]);
            // The failed row says why and stays; the others are done; the modal stays open.
            expect(await screen.findByText('The file content does not match its extension.')).toBeInTheDocument();
            expect(screen.getAllByText('Done')).toHaveLength(2);
            expect(onClose).not.toHaveBeenCalled();

            // Retry sends only the failed file.
            createMock.mockReset().mockResolvedValue({});
            fireEvent.click(screen.getByRole('button', { name: 'Upload asset' }));
            await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
            expect(createMock.mock.calls[0][0].file.name).toBe('b.png');
            await waitFor(() => expect(onClose).toHaveBeenCalled());
        });

        it('removes a file from the table before it is uploaded', async () => {
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} />);

            await userEvent.upload(fileInput(), [png('a.png', 'a'), png('b.png', 'bb')]);
            await userEvent.click(screen.getByRole('button', { name: 'Remove a.png' }));

            expect(screen.queryByLabelText('Name of a.png')).not.toBeInTheDocument();
            expect(screen.getByLabelText('Name of b.png')).toBeInTheDocument();
        });
    });

    describe('the folder', () => {
        it('creates the folders of a new path top down only when the upload starts, then uploads into the last one', async () => {
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} />);

            await userEvent.upload(fileInput(), png('photo.png'));
            await chooseFolder('A / B', 'Create "A / B"');

            // Choosing Create creates nothing yet.
            expect(saveFolderMock).not.toHaveBeenCalled();
            expect(screen.getByText(/Created when you upload: A \/ B/)).toBeInTheDocument();
            fireEvent.click(screen.getByRole('button', { name: 'Upload asset' }));

            await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
            expect(saveFolderMock.mock.calls.map(([arg]) => arg.folder)).toEqual([
                { name: 'A', parent_id: null },
                { name: 'B', parent_id: 101 },
            ]);
            expect(createMock.mock.calls[0][0].folder_id).toBe(102);
        });

        it('matches existing folders without regard to letter case and creates only what is missing', async () => {
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} />);

            await userEvent.upload(fileInput(), png('photo.png'));
            await chooseFolder('team / Week 1', 'Create "team / Week 1"');
            fireEvent.click(screen.getByRole('button', { name: 'Upload asset' }));

            await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
            expect(saveFolderMock.mock.calls.map(([arg]) => arg.folder)).toEqual([{ name: 'Week 1', parent_id: 10 }]);
            expect(createMock.mock.calls[0][0].folder_id).toBe(101);
        });

        it('uses the folder somebody else made meanwhile when the server answers 409', async () => {
            saveFolderMock.mockRejectedValue({ response: { status: 409, data: { error: 'exists' } } });
            const refetched: IAssetFolder[] = [
                ...state.folders,
                { id: 55, name: 'a', parent_id: null, asset_count: 0 },
            ];
            const getFolders = vi.spyOn(AdminAssetApi, 'getFolders').mockResolvedValue(refetched);
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} />);

            await userEvent.upload(fileInput(), png('photo.png'));
            await chooseFolder('A', 'Create "A"');
            fireEvent.click(screen.getByRole('button', { name: 'Upload asset' }));

            await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
            expect(getFolders).toHaveBeenCalled();
            expect(createMock.mock.calls[0][0].folder_id).toBe(55);
            getFolders.mockRestore();
        });

        it('stops and says why when a folder cannot be created, and uploads nothing', async () => {
            saveFolderMock.mockRejectedValue({ response: { status: 403, data: { error: 'You may not create folders.' } } });
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} />);

            await userEvent.upload(fileInput(), png('photo.png'));
            await chooseFolder('A', 'Create "A"');
            fireEvent.click(screen.getByRole('button', { name: 'Upload asset' }));

            expect(await screen.findByText('You may not create folders.')).toBeInTheDocument();
            expect(createMock).not.toHaveBeenCalled();
        });
    });

    describe('identical files', () => {
        it('names the existing asset in a notice that stays until it is closed', async () => {
            createMock.mockResolvedValue({ id: 9, name: 'photo', duplicates: [{ id: 3, name: 'photo-old', folder_id: 10 }] });
            const onClose = vi.fn();
            renderWithProviders(<AssetFormModal opened onClose={onClose} />);

            await userEvent.upload(fileInput(), png('photo.png'));
            fireEvent.click(screen.getByRole('button', { name: 'Upload asset' }));

            await waitFor(() =>
                expect(notify).toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: 'photo is identical to photo-old in Team.',
                        color: 'yellow',
                        autoClose: false,
                    }),
                ),
            );
            // The upload itself went through.
            await waitFor(() => expect(onClose).toHaveBeenCalled());
        });

        it('says "the top level" for an identical asset in no folder', async () => {
            createMock.mockResolvedValue({ id: 9, name: 'photo', duplicates: [{ id: 3, name: 'photo-old', folder_id: null }] });
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} />);

            await userEvent.upload(fileInput(), png('photo.png'));
            fireEvent.click(screen.getByRole('button', { name: 'Upload asset' }));

            await waitFor(() =>
                expect(notify).toHaveBeenCalledWith(expect.objectContaining({ message: 'photo is identical to photo-old in the top level.' })),
            );
        });
    });

    describe('who can manage it', () => {
        it('offers no admin role and says that admins can always manage', async () => {
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} />);

            expect(screen.getByText(/Admins can always manage every asset\./)).toBeInTheDocument();
            await userEvent.click(picker(/Who can manage it/));

            expect(await option('qa_editor')).toBeInTheDocument();
            expect(screen.getByRole('option', { name: 'qa_researcher', hidden: true })).toBeInTheDocument();
            expect(screen.queryByRole('option', { name: 'admin', hidden: true })).not.toBeInTheDocument();
        });

        it('refuses to save when a non-admin emptied the managing roles, and says what to pick', async () => {
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} asset={existing} />);
            await screen.findByDisplayValue('The team');

            await userEvent.click(picker(/Who can manage it/));
            // Backspace in the empty search field removes the last selected role.
            await userEvent.keyboard('{Backspace}');

            expect(await screen.findByText('Pick at least one role.')).toBeInTheDocument();
            const save = screen.getByRole('button', { name: 'Save asset' });
            expect(save).toBeDisabled();
            fireEvent.click(save);
            expect(updateMock).not.toHaveBeenCalled();
        });

        it('lets an admin save an emptied list (then only admins manage the asset)', async () => {
            state.callerRoles = [{ id: 1, name: 'admin', description: null }];
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} asset={existing} />);
            await screen.findByDisplayValue('The team');

            await userEvent.click(picker(/Who can manage it/));
            await userEvent.keyboard('{Backspace}');
            expect(screen.queryByText('Pick at least one role.')).not.toBeInTheDocument();
            fireEvent.click(screen.getByRole('button', { name: 'Save asset' }));

            await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
            expect(updateMock.mock.calls[0][0].data.role_ids).toEqual([]);
        });
    });

    describe('editing', () => {
        it('edits an asset with its groups, roles, folder and alt prefilled, and sends neither groups nor roles it did not change', async () => {
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} asset={existing} />);

            expect(await screen.findByDisplayValue('The team')).toBeInTheDocument();
            expect(screen.queryByText('THIS ASSET IS PUBLIC')).not.toBeInTheDocument();
            expect(picker(/^Folder/)).toHaveValue('Team');
            fireEvent.change(screen.getByLabelText('Name of team'), { target: { value: 'Team photo' } });
            fireEvent.change(screen.getByLabelText('Alt text of team'), { target: { value: 'Our team' } });
            fireEvent.click(screen.getByRole('button', { name: 'Save asset' }));

            await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
            expect(createMock).not.toHaveBeenCalled();
            const { assetId, data } = updateMock.mock.calls[0][0];
            expect(assetId).toBe(7);
            expect(data).toEqual({ file: undefined, name: 'Team photo', alt: 'Our team', folder_id: 10 });
            // A rename must not rewrite who sees or manages the asset.
            expect(data.group_ids).toBeUndefined();
            expect(data.role_ids).toBeUndefined();
        });

        it('sends the managing roles when the admin changed them', async () => {
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} asset={existing} />);
            await screen.findByDisplayValue('The team');

            await userEvent.click(picker(/Who can manage it/));
            await userEvent.click(await option('qa_editor'));
            fireEvent.click(screen.getByRole('button', { name: 'Save asset' }));

            await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
            const { data } = updateMock.mock.calls[0][0];
            expect([...data.role_ids].sort()).toEqual([5, 6]);
            expect(data.group_ids).toBeUndefined();
        });

        it('sends the groups when the admin changed them', async () => {
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} asset={existing} />);
            await screen.findByDisplayValue('The team');

            await userEvent.click(picker(/Who can see it/));
            await userEvent.click(await option('researcher'));
            fireEvent.click(screen.getByRole('button', { name: 'Save asset' }));

            await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
            const { data } = updateMock.mock.calls[0][0];
            expect([...data.group_ids].sort()).toEqual([2, 3]);
            expect(data.role_ids).toBeUndefined();
        });

        it('moves the asset into a new folder path', async () => {
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} asset={existing} />);
            await screen.findByDisplayValue('The team');

            await chooseFolder('Team / 2027', 'Create "Team / 2027"');
            fireEvent.click(screen.getByRole('button', { name: 'Save asset' }));

            await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
            expect(saveFolderMock.mock.calls.map(([arg]) => arg.folder)).toEqual([{ name: '2027', parent_id: 10 }]);
            expect(updateMock.mock.calls[0][0].data.folder_id).toBe(101);
        });

        it('shows the current roles and groups by name when the full lists cannot be read, and locks those pickers', async () => {
            state.groups = { isLoading: false, isError: true };
            state.roles = { isLoading: false, isError: true };
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} asset={existing} />);
            await screen.findByDisplayValue('The team');

            // Names, not ids: the asset itself knows them.
            expect(selectedIn(/Who can manage it/)).toEqual(['qa_researcher']);
            expect(selectedIn(/Who can see it/)).toEqual(['subject']);
            expect(picker(/Who can manage it/)).toBeDisabled();
            expect(picker(/Who can see it/)).toBeDisabled();
            expect(screen.getByText(/not allowed to list the roles/)).toBeInTheDocument();
            expect(screen.getByText(/not allowed to list the groups/)).toBeInTheDocument();

            // The rest of the asset stays editable and the roles and groups are left alone.
            fireEvent.change(screen.getByLabelText('Alt text of team'), { target: { value: 'Our team' } });
            fireEvent.click(screen.getByRole('button', { name: 'Save asset' }));
            await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
            const { data } = updateMock.mock.calls[0][0];
            expect(data.alt).toBe('Our team');
            expect(data.group_ids).toBeUndefined();
            expect(data.role_ids).toBeUndefined();
        });

        it('shows a current role by name even when the list of all roles lacks it', async () => {
            state.roles = { data: { roles: [{ id: 1, name: 'admin' }] }, isLoading: false };
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} asset={existing} />);
            await screen.findByDisplayValue('The team');

            // Role 5 is not in the listed roles: it must not appear as a bare id.
            expect(selectedIn(/Who can manage it/)).toEqual(['qa_researcher']);
        });

        it('replaces the file of the same asset instead of uploading a new one', async () => {
            renderWithProviders(<AssetFormModal opened onClose={vi.fn()} asset={existing} />);

            await screen.findByDisplayValue('The team');
            const replacement = png('team-v2.png', 'new');
            await userEvent.upload(fileInput(), replacement);
            const table = screen.getByRole('table', { name: 'Files' });
            expect(within(table).getByText('Replaced by team-v2.png')).toBeInTheDocument();
            fireEvent.click(screen.getByRole('button', { name: 'Save asset' }));

            await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
            expect(updateMock.mock.calls[0][0].assetId).toBe(7);
            expect(updateMock.mock.calls[0][0].data.file).toBe(replacement);
            expect(createMock).not.toHaveBeenCalled();
        });
    });
});
