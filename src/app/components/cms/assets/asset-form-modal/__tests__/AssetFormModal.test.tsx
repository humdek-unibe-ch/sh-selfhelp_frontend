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
 * picked; editing sends the chosen groups, roles, folder and alt, and a
 * dropped file replaces the bytes of the SAME asset (update, never a new
 * upload).
 */
const { createMock, updateMock } = vi.hoisted(() => ({ createMock: vi.fn(), updateMock: vi.fn() }));

vi.mock('../../../../../../hooks/useGroups', () => ({
    useGroups: () => ({
        data: { groups: [{ id: 2, name: 'researcher' }, { id: 3, name: 'subject' }] },
        isLoading: false,
    }),
}));
vi.mock('../../../../../../hooks/useRoles', () => ({
    useRoles: () => ({ data: { roles: [{ id: 1, name: 'admin' }, { id: 5, name: 'qa_researcher' }] } }),
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
    file_path: 'uploads/assets/22222222-2222-4222-8222-222222222222',
    url: '/cms-api/v1/assets/22222222-2222-4222-8222-222222222222',
    mime_type: 'image/png',
    size: 100,
    alt: 'The team',
    groups: [{ id: 3, name: 'subject' }],
    folder_id: 10,
    roles: [{ id: 5, name: 'qa_researcher' }],
    created_at: '2026-11-03T10:00:00+00:00',
    updated_at: '2026-11-03T10:00:00+00:00',
};

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;

describe('AssetFormModal', () => {
    beforeEach(() => {
        createMock.mockReset().mockResolvedValue({});
        updateMock.mockReset().mockResolvedValue({});
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

    it('edits an asset with its groups, roles, folder and alt prefilled', async () => {
        renderWithProviders(<AssetFormModal opened onClose={vi.fn()} asset={existing} />);

        expect(await screen.findByDisplayValue('The team')).toBeInTheDocument();
        expect(screen.queryByText('THIS ASSET IS PUBLIC')).not.toBeInTheDocument();
        fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Team photo' } });
        fireEvent.change(screen.getByLabelText(/Default alt text/), { target: { value: 'Our team' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save asset' }));

        await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
        expect(createMock).not.toHaveBeenCalled();
        expect(updateMock.mock.calls[0][0]).toEqual({
            assetId: 7,
            data: { file: undefined, name: 'Team photo', alt: 'Our team', group_ids: [3], role_ids: [5], folder_id: 10 },
        });
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
