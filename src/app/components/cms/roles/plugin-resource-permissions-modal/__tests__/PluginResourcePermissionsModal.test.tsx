/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PluginResourcePermissionsModal } from '../PluginResourcePermissionsModal';
import { AdminDataAccessApi } from '../../../../../../api/admin';
import type { IPluginResourceType } from '../../../../../../types/responses/admin/roles.types';

/**
 * A plugin adds a data-access resource type (here surveys). The role screen
 * lists the plugin's resources with the same matrix as pages and data tables,
 * and saving keeps the role's grants of every other type.
 */
const SURVEYS: IPluginResourceType = { id: 90, code: 'surveyjs_survey', label: 'Surveys', plugin_id: 'sh2-shp-survey-js' };

describe('PluginResourcePermissionsModal', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(AdminDataAccessApi, 'getPluginResources').mockResolvedValue([
            { id: 1, name: 'qa_sleep_study', description: 'SV_QA1' },
            { id: 2, name: 'qa_mood_check', description: null },
        ]);
        vi.spyOn(AdminDataAccessApi, 'getRoleEffectivePermissions').mockResolvedValue({
            role_id: 7,
            users_with_role: 1,
            effective_permissions: [
                // An existing grant on survey 1 (view) and a page grant that must survive the save.
                { id_roles: 7, role_name: 'qa_role', id_resource_types: 90, resource_id: 1, resource_type_name: 'Surveys', unified_permissions: 2, individual_permissions: '' },
                { id_roles: 7, role_name: 'qa_role', id_resource_types: 3, resource_id: 55, resource_type_name: 'Pages', unified_permissions: 15, individual_permissions: '' },
            ],
        });
    });

    it('lists the resources the plugin returns for its type', async () => {
        renderWithProviders(<PluginResourcePermissionsModal opened onClose={vi.fn()} roleId={7} roleName="qa_role" resourceType={SURVEYS} />);

        expect(await screen.findByText('qa_sleep_study')).toBeInTheDocument();
        expect(screen.getByText('qa_mood_check')).toBeInTheDocument();
        expect(AdminDataAccessApi.getPluginResources).toHaveBeenCalledWith('surveyjs_survey');
        expect(screen.getByRole('checkbox', { name: 'view qa_sleep_study' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'update qa_mood_check' })).not.toBeChecked();
    });

    it('saves this type\'s grants and keeps the grants of other types', async () => {
        const setRolePermissions = vi.spyOn(AdminDataAccessApi, 'setRolePermissions').mockResolvedValue({
            role_id: 7,
            added: 0,
            updated: 1,
            deleted: 0,
            total_permissions: 3,
        } as never);
        const onClose = vi.fn();
        renderWithProviders(<PluginResourcePermissionsModal opened onClose={onClose} roleId={7} roleName="qa_role" resourceType={SURVEYS} />);

        await userEvent.click(await screen.findByRole('checkbox', { name: 'update qa_mood_check' }));
        await userEvent.click(screen.getByRole('button', { name: 'Save Permissions' }));

        await waitFor(() => expect(setRolePermissions).toHaveBeenCalledTimes(1));
        const [roleId, request] = setRolePermissions.mock.calls[0]!;
        expect(roleId).toBe(7);
        expect(request.permissions).toEqual(expect.arrayContaining([
            { resource_type_id: 90, resource_id: 1, crud_permissions: 2 },
            { resource_type_id: 90, resource_id: 2, crud_permissions: 4 },
            { resource_type_id: 3, resource_id: 55, crud_permissions: 15 },
        ]));
        expect(request.permissions).toHaveLength(3);
        expect(onClose).toHaveBeenCalled();
    });
});
