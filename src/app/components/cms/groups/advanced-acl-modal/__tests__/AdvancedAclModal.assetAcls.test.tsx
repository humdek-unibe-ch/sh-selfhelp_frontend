/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { AdminGroupApi } from '../../../../../../api/admin/group.api';
import { AdminApi } from '../../../../../../api/admin';
import { AdminAssetApi } from '../../../../../../api/admin/asset.api';

// The Pages tab's useAdminPages pulls in the Next router, which isn't under test.
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }) }));

import { AdvancedAclModal } from '../AdvancedAclModal';

/**
 * Regression: the group's "Asset Folders" tab must render the group's saved
 * folder grants as CHECKED once GET /admin/groups/{id}/asset-acls resolves.
 * The endpoint returns { id_groups, acls:[{folder,access_level}] } — the modal
 * seeds `selectedFolders` from `acls` and the checkbox for each granted folder
 * must be checked. This reproduces "champ is granted server-side but the modal
 * shows it unchecked".
 */
describe('AdvancedAclModal — Asset Folders tab', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        // Group details (Pages tab source) — no page ACLs for this group.
        vi.spyOn(AdminGroupApi, 'getGroupById').mockResolvedValue({
            id: 2,
            name: 'therapist',
            description: null,
            id_group_types: 70,
            requires_2fa: false,
            users_count: 0,
            acls: [],
        });
        // Pages tab catalog.
        vi.spyOn(AdminApi, 'getAdminPages').mockResolvedValue([]);
        // Folder catalog derived from the asset list.
        vi.spyOn(AdminAssetApi, 'getAssets').mockResolvedValue({
            assets: [
                { id: 1, file_name: 'a.png', file_path: '/a.png', folder: 'champ' },
                { id: 2, file_name: 'b.png', file_path: '/b.png', folder: 'goalkeeper' },
            ],
            pagination: { page: 1, pageSize: 1000, total: 2, totalPages: 1 },
        });
    });

    it('shows a saved folder grant as checked with its access level', async () => {
        vi.spyOn(AdminGroupApi, 'getGroupAssetAcls').mockResolvedValue({
            acls: [{ folder: 'champ', access_level: 'read' }],
        });

        renderWithProviders(<AdvancedAclModal opened onClose={vi.fn()} groupId={2} groupName="therapist" />);

        // Switch to the Asset Folders tab.
        await userEvent.click(await screen.findByRole('tab', { name: /asset folders/i }));

        // The champ checkbox must be checked once the asset-acls query resolves.
        const champCheckbox = await screen.findByRole('checkbox', { name: /champ/i });
        await waitFor(() => expect(champCheckbox).toBeChecked());

        // goalkeeper exists as a folder but is not granted → unchecked.
        expect(screen.getByRole('checkbox', { name: /goalkeeper/i })).not.toBeChecked();

        // The granted-summary badge reflects the saved grant.
        expect(screen.getByText(/champ · read/i)).toBeInTheDocument();

        // The loading overlay must NOT cover the tab once group details are
        // loaded — the open-time refetch used to leave a spinner over the rows.
        expect(document.querySelector('.mantine-LoadingOverlay-root')).not.toBeInTheDocument();
    });

    it('reflects a manage grant that resolves after the modal has already rendered', async () => {
        // Simulate the endpoint resolving on a later render (the live case that
        // left the checkbox unchecked): the checkbox must still end up checked.
        let resolveAcls!: (v: { acls: { folder: string; access_level: 'read' | 'manage' }[] }) => void;
        vi.spyOn(AdminGroupApi, 'getGroupAssetAcls').mockReturnValue(
            new Promise((res) => {
                resolveAcls = res;
            }),
        );

        renderWithProviders(<AdvancedAclModal opened onClose={vi.fn()} groupId={2} groupName="therapist" />);
        await userEvent.click(await screen.findByRole('tab', { name: /asset folders/i }));

        // Folder rows exist (from the asset list) but nothing is checked yet.
        const goalkeeper = await screen.findByRole('checkbox', { name: /goalkeeper/i });
        expect(goalkeeper).not.toBeChecked();

        // Grants arrive late.
        resolveAcls({ acls: [{ folder: 'goalkeeper', access_level: 'manage' }] });

        await waitFor(() => expect(goalkeeper).toBeChecked());
        expect(screen.getByText(/goalkeeper · manage/i)).toBeInTheDocument();
    });
});
