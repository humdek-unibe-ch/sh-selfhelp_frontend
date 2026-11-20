/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Menu } from '@mantine/core';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';

/**
 * The job menu (list and calendar) offers Execute only with
 * admin.scheduled_job.execute and Delete only with admin.scheduled_job.delete;
 * View Details stays for every reader.
 */
const state = vi.hoisted(() => ({ held: new Set<string>() }));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission: (name: string) => state.held.has(name) } }),
}));

import { ScheduledJobActionsMenuItems } from '../ScheduledJobActionsMenuItems';

const renderMenu = () =>
    renderWithProviders(
        <Menu opened>
            <Menu.Target>
                <button type="button">open</button>
            </Menu.Target>
            <Menu.Dropdown>
                <ScheduledJobActionsMenuItems
                    jobId={1}
                    status="queued"
                    description="qa job"
                    onViewJob={vi.fn()}
                    onExecuteJob={vi.fn()}
                    onDeleteJob={vi.fn()}
                />
            </Menu.Dropdown>
        </Menu>,
    );
const item = (name: string) => screen.queryByRole('menuitem', { name, hidden: true });

describe('ScheduledJobActionsMenuItems rights', () => {
    beforeEach(() => {
        state.held = new Set([PERMISSIONS.ADMIN_SCHEDULED_JOB_READ]);
    });

    it('offers only View Details to a reader', () => {
        renderMenu();
        expect(item('View Details')).toBeInTheDocument();
        expect(item('Execute Job')).not.toBeInTheDocument();
        expect(item('Delete Job')).not.toBeInTheDocument();
    });

    it('offers Execute and Delete with their own rights', () => {
        state.held.add(PERMISSIONS.ADMIN_SCHEDULED_JOB_EXECUTE);
        state.held.add(PERMISSIONS.ADMIN_SCHEDULED_JOB_DELETE);
        renderMenu();
        expect(item('Execute Job')).toBeInTheDocument();
        expect(item('Delete Job')).toBeInTheDocument();
    });
});
