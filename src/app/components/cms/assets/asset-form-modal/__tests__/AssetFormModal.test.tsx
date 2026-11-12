/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type { IAsset } from '../../../../../../api/admin/asset.api';

/**
 * One modal uploads and edits assets. New uploads are public (no groups) and
 * say so loudly, and are managed by the uploader's roles unless roles are
 * picked; editing sends a changed folder and alt, a dropped file replaces the
 * bytes of the SAME asset (update, never a new upload), and the groups and
 * roles are sent ONLY when the admin changed them (the backend replaces the
 * whole set when the field is present).
 */
const { createMock, updateMock, listState } = vi.hoisted(() => ({
    createMock: vi.fn(),
    updateMock: vi.fn(),
    listState: {
        groups: {} as { data?: { groups: { id: number; name: string }[] }; isLoading?: boolean; isError?: boolean },
        roles: {} as { data?: { roles: { id: number; name: string }[] }; isLoading?: boolean; isError?: boolean },
    },
}));

vi.mock('../../../../../../hooks/useGroups', () => ({
    useAllGroups: () => listState.groups,
}));
vi.mock('../../../../../../hooks/useRoles', () => ({
    useAllRoles: () => listState.roles,
}));
vi.mock('../../../../../../hooks/useAssets', () => ({
    useCreateAsset: () => ({ mutateAsync: createMock, isPending: false }),
    useCreateMultipleAssets: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpdateAsset: () => ({ mutateAsync: updateMock, isPending: false }),
    useAssetFolders: () => ({ data: [{ id: 10, name: 'Team', parent_id: null }] }),
}));

import { AssetFormModal } from '../AssetFormModal';

const existing: IAsset = {
    id: 7,
    uuid: '22222222-2222-4222-8222-222222222222',
    name: 'team',
    url: '/cms-api/v1/assets/22222222-2222-4222-8222-222222222222',
    mime_type: 'image/png',
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

/** The picker's search field. (The label also names the open list, so a text query finds two elements.) */
const picker = (label: RegExp) => screen.getByRole('combobox', { name: label });

/** An option of an open list. (jsdom has no layout, so Mantine's dropdown stays `display: none`.) */
const option = (name: string) => screen.findByRole('option', { name, hidden: true });

/** What the picker shows as selected, in order. */
const selectedIn = (label: RegExp): string[] =>
    Array.from(picker(label).closest('.mantine-MultiSelect-root')?.querySelectorAll('.mantine-Pill-label') ?? []).map(
        (pill) => pill.textContent ?? '',
    );

describe('AssetFormModal', () => {
    beforeEach(() => {
        createMock.mockReset().mockResolvedValue({});
        updateMock.mockReset().mockResolvedValue({});
        listState.groups = {
            data: { groups: [{ id: 2, name: 'researcher' }, { id: 3, name: 'subject' }] },
            isLoading: false,
        };
        listState.roles = {
            data: { roles: [{ id: 1, name: 'admin' }, { id: 5, name: 'qa_researcher' }] },
            isLoading: false,
        };
    });

    it('uploads a new file as public, managed by the uploader, and warns that it is public', async () => {
        const onClose = vi.fn();
        renderWithProviders(<AssetFormModal opened onClose={onClose} />);

        const upload = await screen.findByRole('button', { name: 'Upload asset' });
        expect(upload).toBeDisabled();
        expect(screen.getByText('THIS ASSET IS PUBLIC')).toBeInTheDocument();

        await userEvent.upload(fileInput(), new File(['x'], 'photo.png', { type: 'image/png' }));
        fireEvent.change(screen.getByLabelText(/Default alt text/), { target: { value: 'A photo' } });
        fireEvent.click(screen.getByRole('button', { name: 'Upload asset' }));

        await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
        const payload = createMock.mock.calls[0][0];
        expect(payload.file.name).toBe('photo.png');
        // An empty name is not sent: the backend uses the file's own name.
        expect(payload.name).toBeUndefined();
        expect(payload.alt).toBe('A photo');
        expect(payload.group_ids).toEqual([]);
        // No roles picked: omitted, so the backend grants the uploader's roles.
        expect(payload.role_ids).toBeUndefined();
        expect(payload.folder_id).toBeNull();
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('edits an asset with its groups, roles, folder and alt prefilled, and sends neither groups nor roles it did not change', async () => {
        renderWithProviders(<AssetFormModal opened onClose={vi.fn()} asset={existing} />);

        expect(await screen.findByDisplayValue('The team')).toBeInTheDocument();
        expect(screen.queryByText('THIS ASSET IS PUBLIC')).not.toBeInTheDocument();
        fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Team photo' } });
        fireEvent.change(screen.getByLabelText(/Default alt text/), { target: { value: 'Our team' } });
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
        await userEvent.click(await option('admin'));
        fireEvent.click(screen.getByRole('button', { name: 'Save asset' }));

        await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
        const { data } = updateMock.mock.calls[0][0];
        expect([...data.role_ids].sort()).toEqual([1, 5]);
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

    it('refuses to save when the managing roles were emptied, and says what to pick', async () => {
        renderWithProviders(<AssetFormModal opened onClose={vi.fn()} asset={existing} />);
        await screen.findByDisplayValue('The team');

        await userEvent.click(picker(/Who can manage it/));
        // Backspace in the empty search field removes the last selected role.
        await userEvent.keyboard('{Backspace}');

        expect(
            await screen.findByText('Pick at least one role. Choose admin to keep this asset admin-only.'),
        ).toBeInTheDocument();
        const save = screen.getByRole('button', { name: 'Save asset' });
        expect(save).toBeDisabled();
        fireEvent.click(save);
        expect(updateMock).not.toHaveBeenCalled();
    });

    it('shows the current roles and groups by name when the full lists cannot be read, and locks those pickers', async () => {
        listState.groups = { isLoading: false, isError: true };
        listState.roles = { isLoading: false, isError: true };
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
        fireEvent.change(screen.getByLabelText(/Default alt text/), { target: { value: 'Our team' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save asset' }));
        await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
        const { data } = updateMock.mock.calls[0][0];
        expect(data.alt).toBe('Our team');
        expect(data.group_ids).toBeUndefined();
        expect(data.role_ids).toBeUndefined();
    });

    it('shows a current role by name even when the list of all roles lacks it', async () => {
        listState.roles = { data: { roles: [{ id: 1, name: 'admin' }] }, isLoading: false };
        renderWithProviders(<AssetFormModal opened onClose={vi.fn()} asset={existing} />);
        await screen.findByDisplayValue('The team');

        // Role 5 is not in the listed roles: it must not appear as a bare id.
        expect(selectedIn(/Who can manage it/)).toEqual(['qa_researcher']);
    });

    it('replaces the file of the same asset instead of uploading a new one', async () => {
        renderWithProviders(<AssetFormModal opened onClose={vi.fn()} asset={existing} />);

        await screen.findByDisplayValue('The team');
        const replacement = new File(['new'], 'team-v2.png', { type: 'image/png' });
        await userEvent.upload(fileInput(), replacement);
        fireEvent.click(screen.getByRole('button', { name: 'Save asset' }));

        await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
        expect(updateMock.mock.calls[0][0].assetId).toBe(7);
        expect(updateMock.mock.calls[0][0].data.file).toBe(replacement);
        expect(createMock).not.toHaveBeenCalled();
    });
});
