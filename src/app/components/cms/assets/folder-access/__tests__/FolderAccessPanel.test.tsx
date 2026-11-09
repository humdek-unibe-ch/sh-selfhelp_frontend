/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';

/**
 * The folder open-access toggle is gated on `admin.group.acl` — NOT an asset
 * permission — because making a folder world-readable is an access-control
 * decision. A user with asset rights but without it must see the state
 * READ-ONLY (disabled switch), never hidden and never editable.
 *
 * Enabling exposes content to logged-out visitors, so it is confirmed via a
 * dialog naming the folder; disabling needs no confirmation.
 */
const { hasPermission, mutate } = vi.hoisted(() => ({
    hasPermission: vi.fn(),
    mutate: vi.fn(),
}));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission }, user: null, isLoading: false, error: null }),
}));
vi.mock('../../../../../../hooks/useAssets', () => ({
    useAssetFolders: () => ({
        data: {
            folders: [
                { folder: 'general', is_open_access: true },
                { folder: 'champ', is_open_access: false },
            ],
        },
        isLoading: false,
    }),
    useSetFolderOpenAccess: () => ({ mutate, isPending: false }),
}));

import { FolderAccessPanel } from '../FolderAccessPanel';

const switchFor = (folder: string) =>
    screen.getByRole('switch', { name: new RegExp(`anyone can view files in ${folder}`, 'i') });

describe('FolderAccessPanel', () => {
    beforeEach(() => {
        hasPermission.mockReset();
        mutate.mockReset();
    });

    describe('with admin.group.acl', () => {
        beforeEach(() => {
            hasPermission.mockImplementation((p: string) => p === PERMISSIONS.ADMIN_GROUP_ACL);
        });

        it('renders each folder with its current open-access state', () => {
            renderWithProviders(<FolderAccessPanel />);
            expect(switchFor('general')).toBeChecked();
            expect(switchFor('champ')).not.toBeChecked();
        });

        it('enables the switches so access can be changed', () => {
            renderWithProviders(<FolderAccessPanel />);
            expect(switchFor('champ')).toBeEnabled();
        });

        it('confirms before making a folder public, then sends the PUT', async () => {
            renderWithProviders(<FolderAccessPanel />);
            fireEvent.click(switchFor('champ'));

            // Confirmation names the folder; nothing is sent until it is accepted.
            expect(await screen.findByText(/make this folder public/i)).toBeInTheDocument();
            expect(mutate).not.toHaveBeenCalled();

            fireEvent.click(screen.getByRole('button', { name: /make public/i }));

            await waitFor(() => {
                expect(mutate).toHaveBeenCalledWith(
                    { folder: 'champ', isOpenAccess: true },
                    expect.anything()
                );
            });
        });

        it('reflects the response by invalidating through the mutation on success', async () => {
            renderWithProviders(<FolderAccessPanel />);
            fireEvent.click(switchFor('champ'));
            fireEvent.click(await screen.findByRole('button', { name: /make public/i }));

            await waitFor(() => expect(mutate).toHaveBeenCalled());

            // Drive the success path the way React Query would.
            const onSuccess = mutate.mock.calls[0][1].onSuccess as (r: unknown) => void;
            act(() => onSuccess({ folder: 'champ', is_open_access: true }));

            await waitFor(() => {
                expect(screen.queryByText(/make this folder public/i)).not.toBeInTheDocument();
            });
        });

        it('turns a folder private immediately, without confirmation', async () => {
            renderWithProviders(<FolderAccessPanel />);
            fireEvent.click(switchFor('general'));

            expect(screen.queryByText(/make this folder public/i)).not.toBeInTheDocument();
            await waitFor(() => {
                expect(mutate).toHaveBeenCalledWith(
                    { folder: 'general', isOpenAccess: false },
                    expect.anything()
                );
            });
        });
    });

    describe('without admin.group.acl', () => {
        beforeEach(() => {
            // Asset rights only — enough to SEE folders, not to change access.
            hasPermission.mockImplementation((p: string) => p === PERMISSIONS.ADMIN_ASSET_READ);
        });

        it('hides the panel entirely rather than showing dead controls', () => {
            // The open-access STATE stays visible as the "Public" badge on each
            // folder in the tree; a card of permanently-disabled switches would
            // only be noise for someone who can never use it.
            renderWithProviders(<FolderAccessPanel />);
            expect(screen.queryByText(/folder access/i)).not.toBeInTheDocument();
            expect(screen.queryByText('general')).not.toBeInTheDocument();
            expect(screen.queryByText('champ')).not.toBeInTheDocument();
        });

        it('offers no way to change access', () => {
            renderWithProviders(<FolderAccessPanel />);
            expect(screen.queryByRole('switch')).not.toBeInTheDocument();
            expect(mutate).not.toHaveBeenCalled();
        });
    });
});
