/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type { IAssetFolder } from '../../../../../../api/admin/asset.api';

/**
 * Setting a folder's access is a one-time apply to the assets in it. Each of
 * the two settings is sent only when its switch is on; nothing can be saved with
 * both off; the dialog says that files added later are not affected; a refusal
 * (403) shows the server's message.
 */
const { setAccess, notify, caller } = vi.hoisted(() => ({
    setAccess: vi.fn(),
    notify: vi.fn(),
    caller: { roles: [{ id: 5, name: 'qa_researcher', description: null }] as { id: number; name: string; description: null }[] },
}));

vi.mock('@mantine/notifications', () => ({ notifications: { show: notify } }));
vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ user: { roles: caller.roles }, permissionChecker: null, isLoading: false, error: null }),
}));
vi.mock('../../../../../../hooks/useGroups', () => ({
    useAllGroups: () => ({
        data: { groups: [{ id: 2, name: 'researcher' }, { id: 3, name: 'subject' }] },
        isLoading: false,
        isError: false,
    }),
}));
vi.mock('../../../../../../hooks/useRoles', () => ({
    useAllRoles: () => ({
        data: { roles: [{ id: 1, name: 'admin' }, { id: 5, name: 'qa_researcher' }, { id: 6, name: 'qa_editor' }] },
        isLoading: false,
        isError: false,
    }),
}));
vi.mock('../../../../../../hooks/useAssets', () => ({
    useSetAssetFolderAccess: () => ({ mutateAsync: setAccess, isPending: false }),
    useAssetFolders: () => ({ data: [] }),
}));

import { AssetFolderAccessModal } from '../AssetFolderAccessModal';

const folder: IAssetFolder = { id: 10, name: 'Team', parent_id: null, asset_count: 2, subtree_asset_count: 4 };

const apply = () => screen.getByRole('button', { name: 'Apply to assets' });
const picker = (label: RegExp) => screen.getByRole('combobox', { name: label });
/** An option of an open list. (jsdom has no layout, so Mantine's dropdown stays `display: none`.) */
const option = (name: string) => screen.findByRole('option', { name, hidden: true });
const switchFor = (label: string) => screen.getByRole('switch', { name: label });

describe('AssetFolderAccessModal', () => {
    beforeEach(() => {
        setAccess.mockReset().mockResolvedValue({ updated: 4 });
        notify.mockReset();
        caller.roles = [{ id: 5, name: 'qa_researcher', description: null }];
        Element.prototype.scrollIntoView = vi.fn();
    });

    it('says how many assets change and that files added later keep their own access', () => {
        renderWithProviders(<AssetFolderAccessModal opened onClose={vi.fn()} folder={folder} />);

        expect(screen.getByText('4 assets in this folder and its subfolders will change.')).toBeInTheDocument();
        expect(
            screen.getByText('This changes the files that are in the folder now. Files added later keep the access chosen when they are uploaded.'),
        ).toBeInTheDocument();
    });

    it('cannot be saved with both switches off', async () => {
        renderWithProviders(<AssetFolderAccessModal opened onClose={vi.fn()} folder={folder} />);

        expect(apply()).toBeDisabled();
        await userEvent.click(switchFor('Change who can see'));
        expect(apply()).toBeEnabled();
        await userEvent.click(switchFor('Change who can see'));
        expect(apply()).toBeDisabled();
        expect(setAccess).not.toHaveBeenCalled();
    });

    it('sends only the groups when only "who can see" is on, and warns that empty means public', async () => {
        const onClose = vi.fn();
        renderWithProviders(<AssetFolderAccessModal opened onClose={onClose} folder={folder} />);

        await userEvent.click(switchFor('Change who can see'));
        expect(screen.getByText('THESE ASSETS WILL BE PUBLIC')).toBeInTheDocument();
        expect(screen.queryByRole('combobox', { name: /Who can manage it/ })).not.toBeInTheDocument();
        await userEvent.click(apply());

        await waitFor(() => expect(setAccess).toHaveBeenCalledWith({ folderId: 10, access: { group_ids: [] } }));
        expect(setAccess.mock.calls[0][0].access).not.toHaveProperty('role_ids');
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('sends both lists when both switches are on, and the groups picked take the public warning away', async () => {
        renderWithProviders(<AssetFolderAccessModal opened onClose={vi.fn()} folder={folder} />);

        await userEvent.click(switchFor('Change who can see'));
        await userEvent.click(switchFor('Change who can manage'));
        await userEvent.click(picker(/Who can see it/));
        await userEvent.click(await option('researcher'));
        expect(screen.queryByText('THESE ASSETS WILL BE PUBLIC')).not.toBeInTheDocument();
        await userEvent.click(picker(/Who can manage it/));
        await userEvent.click(await option('qa_editor'));
        await userEvent.click(apply());

        await waitFor(() => expect(setAccess).toHaveBeenCalledWith({ folderId: 10, access: { group_ids: [2], role_ids: [6] } }));
    });

    it('offers no admin role and needs one role from a caller who is not an admin', async () => {
        renderWithProviders(<AssetFolderAccessModal opened onClose={vi.fn()} folder={folder} />);

        await userEvent.click(switchFor('Change who can manage'));

        expect(screen.getByText(/Admins can always manage every asset\./)).toBeInTheDocument();
        await userEvent.click(picker(/Who can manage it/));
        expect(await option('qa_editor')).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'admin', hidden: true })).not.toBeInTheDocument();
        expect(await screen.findByText('Pick at least one role.')).toBeInTheDocument();
        expect(apply()).toBeDisabled();
    });

    it('lets an admin leave the managing roles empty', async () => {
        caller.roles = [{ id: 1, name: 'admin', description: null }];
        renderWithProviders(<AssetFolderAccessModal opened onClose={vi.fn()} folder={folder} />);

        await userEvent.click(switchFor('Change who can manage'));
        expect(screen.queryByText('Pick at least one role.')).not.toBeInTheDocument();
        await userEvent.click(apply());

        await waitFor(() => expect(setAccess).toHaveBeenCalledWith({ folderId: 10, access: { role_ids: [] } }));
    });

    it('shows the server message and stays open when it refuses', async () => {
        const onClose = vi.fn();
        setAccess.mockRejectedValue({ response: { status: 403, data: { error: 'You may not manage "qa-admin-only".' } } });
        renderWithProviders(<AssetFolderAccessModal opened onClose={onClose} folder={folder} />);

        await userEvent.click(switchFor('Change who can see'));
        await userEvent.click(apply());

        expect(await screen.findByText('You may not manage "qa-admin-only".')).toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
    });
});
