/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Component coverage for the admin System Maintenance / Update page.
 *
 * Focus (Testing Rule 26 spirit — the UI must enforce the contract, not just
 * rely on backend rejection):
 *   - the security advisories card renders the registry feed filtered to this
 *     instance, and degrades to "could not check" when the registry is offline;
 *   - the update-request flow runs a preflight then requests an update WITHOUT
 *     ever sending an `instance_id` (the backend derives it);
 *   - a `blocked` preflight disables the request button;
 *   - the request button is hidden for an admin without `admin.system.update`.
 *
 * The data hooks (`useSystem`) and `useAuth` are mocked so the test is
 * deterministic and asserts UI behaviour rather than network wiring (the
 * request/response shapes are guarded by the shared schema-parity check).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type {
    ISystemAdvisories, ISystemHealth, ISystemMaintenance, ISystemVersion,
    IUpdatePreflight, IUpdateStatus,
} from '../../../../../../types/responses/admin/system.types';

const state = vi.hoisted(() => ({
    canUpdate: true,
    canManageMaintenance: true,
    version: null as ISystemVersion | null,
    health: null as ISystemHealth | null,
    advisories: null as ISystemAdvisories | null,
    maintenance: null as ISystemMaintenance | null,
    status: null as IUpdateStatus | null,
    preflight: null as IUpdatePreflight | null,
    requestMutate: vi.fn(),
}));

vi.mock('../../../../../../hooks/useAuth', () => ({
    useAuth: () => ({
        permissionChecker: {
            canUpdateSystem: () => state.canUpdate,
            canManageMaintenance: () => state.canManageMaintenance,
        },
    }),
}));

vi.mock('../../../../../../hooks/useSystem', () => ({
    useSystemVersion: () => ({ data: state.version, isLoading: false, isError: false }),
    useSystemHealth: () => ({ data: state.health, isLoading: false, isError: false }),
    useSystemAdvisories: () => ({ data: state.advisories, isLoading: false, isError: false }),
    useSystemMaintenance: () => ({ data: state.maintenance, isLoading: false, isError: false }),
    useSetMaintenanceMutation: () => ({ mutate: vi.fn(), isPending: false }),
    // Preflight is gated on a non-null target in the real hook; mirror that so
    // data only appears AFTER the user clicks "Check compatibility".
    useUpdatePreflight: (target: string | null) => ({
        data: target ? state.preflight : undefined,
        isError: false,
        isFetching: false,
    }),
    useUpdateStatus: () => ({ data: state.status }),
    useRequestUpdateMutation: () => ({ mutate: state.requestMutate, isPending: false }),
}));

vi.mock('../../../../shared/common/PageHeader', () => ({
    PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
        <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
        </div>
    ),
}));

import { SystemMaintenancePage } from '../SystemMaintenancePage';

function version(): ISystemVersion {
    return {
        instance_id: 'qa-instance',
        selfhelp_version: '0.1.0',
        backend_version: '0.1.0',
        frontend_version: '0.1.0',
        plugin_api_version: '0.1.0',
        database_migration_version: 'Version20260608174905',
        safe_mode: false,
        maintenance_mode: false,
        installed_plugins: [],
    };
}

function health(): ISystemHealth {
    return {
        instance_id: 'qa-instance',
        overall: 'healthy',
        checked_at: '2026-06-08T00:00:00Z',
        safe_mode: false,
        maintenance_mode: false,
        version: { selfhelp: '0.1.0', backend: '0.1.0', frontend: '0.1.0', plugin_api: '0.1.0', database_migration: 'Version20260608174905' },
        update: { operation_id: '', status: 'succeeded', progress_percent: 100 },
        components: [{ name: 'database', status: 'ok', detail: 'reachable' }],
    };
}

function maintenance(): ISystemMaintenance {
    return { enabled: false, forced_by_env: false, message: '', since: '', updated_by: '', safe_mode: false };
}

/** "No active operation" status shape so the operation panel stays hidden. */
function idleStatus(): IUpdateStatus {
    return {
        instance_id: 'qa-instance',
        operation_id: '',
        status: 'succeeded',
        target_version: '0.1.0',
        progress_percent: 100,
        steps: [],
        requested_at: '2026-06-08T00:00:00Z',
        updated_at: '2026-06-08T00:00:00Z',
    };
}

function preflight(overrides: Partial<IUpdatePreflight> = {}): IUpdatePreflight {
    return {
        preflight_id: 'pf-qa-001',
        status: 'warning',
        instance_id: 'qa-instance',
        current_version: '0.1.0',
        target_version: '0.2.0',
        checks: [{ code: 'registry_unreachable', severity: 'warning', message: 'Registry metadata unavailable; the manager re-validates.' }],
        options: [],
        database: { destructive: false, requires_backup: true, manual_confirmation_required: false },
        rollback: { automatic_before_migrations: true, automatic_after_destructive_migrations: false },
        ...overrides,
    };
}

describe('SystemMaintenancePage', () => {
    beforeEach(() => {
        state.canUpdate = true;
        state.canManageMaintenance = true;
        state.version = version();
        state.health = health();
        state.advisories = { available: true, advisories: [] };
        state.maintenance = maintenance();
        state.status = idleStatus();
        state.preflight = preflight();
        state.requestMutate = vi.fn();
    });

    it('renders security advisories filtered to this instance', () => {
        state.advisories = {
            available: true,
            advisories: [
                {
                    id: 'SHSA-2026-0001',
                    severity: 'high',
                    recommended_action: 'Update SelfHelp core to a fixed version.',
                    blocked: true,
                    details_url: 'https://example.test/advisory',
                    affected: [{ kind: 'core', id: 'selfhelp-core', installed_version: '0.1.0' }],
                    fixed_versions: ['0.1.1'],
                },
            ],
        };

        renderWithProviders(<SystemMaintenancePage />);

        expect(screen.getByText(/affecting this instance/i)).toBeInTheDocument();
        expect(screen.getByText('SHSA-2026-0001')).toBeInTheDocument();
        expect(screen.getByText('Update SelfHelp core to a fixed version.')).toBeInTheDocument();
        expect(screen.getByText(/Blocks updates/i)).toBeInTheDocument();
    });

    it('degrades the advisories card to "could not check" when the registry is offline', () => {
        state.advisories = { available: false, advisories: [] };

        renderWithProviders(<SystemMaintenancePage />);

        expect(screen.getByText(/Could not check/i)).toBeInTheDocument();
        expect(screen.getByText(/official registry could not be reached/i)).toBeInTheDocument();
    });

    it('runs a preflight then requests an update without sending an instance_id', () => {
        renderWithProviders(<SystemMaintenancePage />);

        // No preflight yet, so no request button.
        expect(screen.queryByRole('button', { name: /Request update for this instance/i })).not.toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Target version'), { target: { value: '8.1.0' } });
        fireEvent.click(screen.getByRole('button', { name: /Check compatibility/i }));

        const requestButton = screen.getByRole('button', { name: /Request update for this instance/i });
        expect(requestButton).toBeEnabled();

        fireEvent.click(requestButton);

        expect(state.requestMutate).toHaveBeenCalledTimes(1);
        const body = state.requestMutate.mock.calls[0][0];
        // Hard rule: the browser never sends an instance_id.
        expect(body).not.toHaveProperty('instance_id');
        expect(body.target_version).toBe('8.1.0');
        expect(body.preflight_id).toBe('pf-qa-001');
        expect(body.accepted_migration_risk).toBe(false);
    });

    it('disables the request button when the preflight is blocked', () => {
        state.preflight = preflight({
            status: 'blocked',
            checks: [{ code: 'downgrade', severity: 'error', message: 'Downgrades are not supported.' }],
        });

        renderWithProviders(<SystemMaintenancePage />);
        fireEvent.change(screen.getByLabelText('Target version'), { target: { value: '8.1.0' } });
        fireEvent.click(screen.getByRole('button', { name: /Check compatibility/i }));

        expect(screen.getByRole('button', { name: /Request update for this instance/i })).toBeDisabled();
        expect(screen.getByText(/This update is blocked/i)).toBeInTheDocument();
    });

    it('hides the request button for an admin without admin.system.update', () => {
        state.canUpdate = false;

        renderWithProviders(<SystemMaintenancePage />);
        fireEvent.change(screen.getByLabelText('Target version'), { target: { value: '8.1.0' } });
        fireEvent.click(screen.getByRole('button', { name: /Check compatibility/i }));

        expect(screen.queryByRole('button', { name: /Request update for this instance/i })).not.toBeInTheDocument();
        expect(screen.getByText(/need the/i)).toBeInTheDocument();
    });
});
