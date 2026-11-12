/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { GroupPermissionsModal } from '../GroupPermissionsModal';
import { AdminDataAccessApi } from '../../../../../../api/admin';
import { LookupsApi } from '../../../../../../api/lookups.api';
import type { IGroupDetails } from '../../../../../../types/responses/admin/groups.types';

/**
 * A group has no type any more: it only decides who sees a page or an asset.
 * The role's group matrix therefore shows a group's name, its member count and
 * the 2FA badge, and never a "Type N" badge.
 */
function group(id: number, name: string, requires2fa: boolean): IGroupDetails {
    return { id, name, description: null, add_to_new_pages: false, requires_2fa: requires2fa, users_count: 3, acls: [] };
}

describe('GroupPermissionsModal', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(AdminDataAccessApi, 'getRoleEffectivePermissions').mockResolvedValue({
            role_id: 7,
            users_with_role: 0,
            effective_permissions: [],
        });
        vi.spyOn(LookupsApi, 'getResourceTypeId').mockResolvedValue(4);
    });

    it('shows each group with its member count and 2FA badge, and no group type', async () => {
        // A payload from an older backend would still carry the removed field:
        // the screen must not draw a badge from it.
        const legacy = { ...group(2, 'qa_study_team', true), id_group_types: 3 };
        vi.spyOn(AdminDataAccessApi, 'getAvailableGroups').mockResolvedValue([group(1, 'qa_open_group', false), legacy]);

        renderWithProviders(<GroupPermissionsModal opened onClose={vi.fn()} roleId={7} roleName="qa_role" />);

        expect(await screen.findByText('qa_study_team')).toBeInTheDocument();
        expect(screen.getByText('qa_open_group')).toBeInTheDocument();
        expect(screen.getAllByText('3 members')).toHaveLength(2);

        // Exactly one group requires 2FA, so exactly one badge says so.
        expect(screen.getAllByText('2FA')).toHaveLength(1);
        expect(screen.queryByText(/^Type \d+$/)).not.toBeInTheDocument();
    });
});
