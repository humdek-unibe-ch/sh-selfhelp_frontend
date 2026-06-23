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
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type {
    ISystemAdvisories, ISystemHealth, ISystemMaintenance, ISystemVersion,
    IUpdatePreflight, IUpdateStatus, IUpdateReleases,
    IFrontendUpdatePreflight, IFrontendUpdateReleases,
    IMobilePreviewUpdatePreflight, IMobilePreviewUpdateReleases,
} from '../../../../../../shared';

const state = vi.hoisted(() => ({
    canUpdate: true,
    canManageMaintenance: true,
    version: null as ISystemVersion | null,
    health: null as ISystemHealth | null,
    advisories: null as ISystemAdvisories | null,
    maintenance: null as ISystemMaintenance | null,
    status: null as IUpdateStatus | null,
    preflight: null as IUpdatePreflight | null,
    releases: null as IUpdateReleases | null,
    frontendReleases: null as IFrontendUpdateReleases | null,
    frontendPreflight: null as IFrontendUpdatePreflight | null,
    mobilePreviewReleases: null as IMobilePreviewUpdateReleases | null,
    mobilePreviewPreflight: null as IMobilePreviewUpdatePreflight | null,
    requestMutate: vi.fn(),
    frontendRequestMutate: vi.fn(),
    mobilePreviewRequestMutate: vi.fn(),
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
    useUpdateReleases: () => ({ data: state.releases, isLoading: false, isError: false }),
    useFrontendUpdateReleases: () => ({ data: state.frontendReleases, isLoading: false, isError: false }),
    // Mirror the real hook: the frontend preflight is gated on a non-null target.
    useFrontendUpdatePreflight: (target: string | null) => ({
        data: target ? state.frontendPreflight : undefined,
        isError: false,
        isFetching: false,
    }),
    useRequestFrontendUpdateMutation: () => ({ mutate: state.frontendRequestMutate, isPending: false }),
    useMobilePreviewUpdateReleases: () => ({ data: state.mobilePreviewReleases, isLoading: false, isError: false }),
    // Mirror the real hook: the mobile-preview preflight is gated on a non-null target.
    useMobilePreviewUpdatePreflight: (target: string | null) => ({
        data: target ? state.mobilePreviewPreflight : undefined,
        isError: false,
        isFetching: false,
    }),
    useRequestMobilePreviewUpdateMutation: () => ({ mutate: state.mobilePreviewRequestMutate, isPending: false }),
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
        mobile_preview_version: '0.1.0',
        plugin_api_version: '0.1.0',
        database_migration_version: 'Version20260608174905',
        deployment: 'docker',
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
        update: { operation_id: '', status: 'idle', progress_percent: 0 },
        components: [{ name: 'database', status: 'ok', detail: 'reachable' }],
    };
}

function maintenance(): ISystemMaintenance {
    return { enabled: false, forced_by_env: false, message: '', since: '', updated_by: '', safe_mode: false };
}

/** Never-updated instance: backend reports the honest `idle` state (empty
 * operation_id, 0%), so the operation panel stays hidden. */
function idleStatus(): IUpdateStatus {
    return {
        instance_id: 'qa-instance',
        operation_id: '',
        status: 'idle',
        kind: 'core',
        target_version: '0.1.0',
        target_frontend_version: null,
        target_mobile_preview_version: null,
        progress_percent: 0,
        steps: [],
        requested_at: '2026-06-08T00:00:00Z',
        updated_at: '2026-06-08T00:00:00Z',
        manager: { configured: true, last_seen_at: '2026-06-08T00:00:00Z', requested_stale: false },
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

/** A frontend-only preflight: stateless, so never destructive / backup-required. */
function frontendPreflight(overrides: Partial<IFrontendUpdatePreflight> = {}): IFrontendUpdatePreflight {
    return {
        preflight_id: 'fe-pf-qa-001',
        status: 'ok',
        instance_id: 'qa-instance',
        current_version: '0.1.5',
        target_version: '0.1.7',
        checks: [{ code: 'resource', severity: 'info', message: 'The SelfHelp Manager performs the authoritative checks at execution time.' }],
        options: [{ type: 'frontend', version: '0.1.7', label: 'SelfHelp frontend 0.1.7' }],
        database: { destructive: false, requires_backup: false, manual_confirmation_required: false },
        rollback: { automatic_before_migrations: true, automatic_after_destructive_migrations: true },
        ...overrides,
    };
}

/** A mobile-preview preflight: stateless, so never destructive / backup-required. */
function mobilePreviewPreflight(overrides: Partial<IMobilePreviewUpdatePreflight> = {}): IMobilePreviewUpdatePreflight {
    return {
        preflight_id: 'mp-pf-qa-001',
        status: 'ok',
        instance_id: 'qa-instance',
        current_version: '0.1.0',
        target_version: '0.2.3',
        checks: [{ code: 'resource', severity: 'info', message: 'The SelfHelp Manager performs the authoritative checks at execution time.' }],
        options: [{ type: 'mobile-preview', version: '0.2.3', label: 'SelfHelp mobile preview 0.2.3' }],
        database: { destructive: false, requires_backup: false, manual_confirmation_required: false },
        rollback: { automatic_before_migrations: true, automatic_after_destructive_migrations: true },
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
        state.releases = {
            available: true,
            current_version: '0.1.0',
            releases: [
                { version: '0.2.0', channel: 'stable', blocked: false },
                { version: '0.1.0', channel: 'stable', blocked: false },
            ],
        };
        state.frontendReleases = {
            available: true,
            current_version: '0.1.5',
            releases: [
                { version: '0.1.7', channel: 'stable', blocked: false },
                { version: '0.1.5', channel: 'stable', blocked: false },
            ],
        };
        state.frontendPreflight = frontendPreflight();
        // Default: the mobile preview is installed and already on the newest
        // published version, so it shows "Up to date" and adds no New:/Install:
        // badge (keeping the at-a-glance assertions unambiguous).
        state.mobilePreviewReleases = {
            available: true,
            current_version: '0.1.0',
            releases: [{ version: '0.1.0', channel: 'stable', blocked: false }],
        };
        state.mobilePreviewPreflight = mobilePreviewPreflight();
        state.requestMutate = vi.fn();
        state.frontendRequestMutate = vi.fn();
        state.mobilePreviewRequestMutate = vi.fn();
    });

    it('shows the deployment kind and distinguishes a source checkout from a Docker install', () => {
        renderWithProviders(<SystemMaintenancePage />);
        expect(screen.getByText('Docker image')).toBeInTheDocument();

        state.version = { ...version(), deployment: 'source' };
        renderWithProviders(<SystemMaintenancePage />);
        expect(screen.getByText('Source checkout')).toBeInTheDocument();
        expect(screen.getByText(/not a managed install/i)).toBeInTheDocument();
    });

    it('falls back to the self-reported frontend version when the backend reports unknown', () => {
        state.version = { ...version(), frontend_version: 'unknown' };

        renderWithProviders(<SystemMaintenancePage />);

        // The literal "unknown" is replaced by the build-time package version
        // plus an explanation of where the backend value would come from.
        expect(screen.getByText(/self-reported/i)).toBeInTheDocument();
        expect(screen.getByText(/SELFHELP_FRONTEND_VERSION/)).toBeInTheDocument();
    });

    it('feeds the target-version picker from the registry releases and excludes the current version', () => {
        renderWithProviders(<SystemMaintenancePage />);

        const input = screen.getByTestId('target-version-input');
        expect(
            screen.getByText(/Versions published in the official registry/i),
        ).toBeInTheDocument();

        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: '0.' } });
        // 0.2.0 is offered; the currently installed 0.1.0 is not.
        expect(screen.getByRole('option', { name: '0.2.0' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: '0.1.0' })).not.toBeInTheDocument();
    });

    it('falls back to manual version entry when the registry is unreachable', () => {
        state.releases = { available: false, current_version: '0.1.0', releases: [] };

        renderWithProviders(<SystemMaintenancePage />);

        expect(screen.getByText(/type the target version manually/i)).toBeInTheDocument();
        // Manual entry + preflight still work without the registry.
        fireEvent.change(screen.getByTestId('target-version-input'), { target: { value: '0.2.0' } });
        fireEvent.click(screen.getByRole('button', { name: /Check compatibility/i }));
        expect(screen.getByRole('button', { name: /Request update for this instance/i })).toBeInTheDocument();
    });

    it('shows at a glance whether an update is available and the newest version to move to', () => {
        // Default fixtures: core 0.1.0 → 0.2.0 published, frontend 0.1.5 → 0.1.7.
        renderWithProviders(<SystemMaintenancePage />);

        const panel = within(screen.getByTestId('update-availability'));
        expect(panel.getByText('Update available')).toBeInTheDocument();
        // The newest installable version for each component is surfaced directly.
        expect(panel.getByText('New: 0.2.0')).toBeInTheDocument();
        expect(panel.getByText('New: 0.1.7')).toBeInTheDocument();
    });

    it('marks the instance up to date when it already runs the newest releases', () => {
        state.releases = {
            available: true,
            current_version: '0.2.0',
            releases: [
                { version: '0.2.0', channel: 'stable', blocked: false },
                { version: '0.1.0', channel: 'stable', blocked: false },
            ],
        };
        state.frontendReleases = {
            available: true,
            current_version: '0.1.7',
            releases: [{ version: '0.1.7', channel: 'stable', blocked: false }],
        };

        renderWithProviders(<SystemMaintenancePage />);

        const panel = within(screen.getByTestId('update-availability'));
        expect(panel.queryByText('Update available')).not.toBeInTheDocument();
        // Header + both component rows all report "Up to date".
        expect(panel.getAllByText('Up to date').length).toBeGreaterThanOrEqual(1);
    });

    it('ignores a newer BLOCKED release when deciding the latest installable version', () => {
        // A 0.3.0 exists but is blocked (e.g. a pulled release); the newest version
        // the operator can actually move to is 0.2.0, so no update is offered over it.
        state.releases = {
            available: true,
            current_version: '0.2.0',
            releases: [
                { version: '0.3.0', channel: 'stable', blocked: true },
                { version: '0.2.0', channel: 'stable', blocked: false },
            ],
        };
        state.frontendReleases = {
            available: true,
            current_version: '0.1.7',
            releases: [{ version: '0.1.7', channel: 'stable', blocked: false }],
        };

        renderWithProviders(<SystemMaintenancePage />);

        const panel = within(screen.getByTestId('update-availability'));
        expect(panel.queryByText('New: 0.3.0')).not.toBeInTheDocument();
        expect(panel.queryByText('Update available')).not.toBeInTheDocument();
    });

    it('one-click "Use latest" seeds the picker with the newest version and runs its preflight', () => {
        renderWithProviders(<SystemMaintenancePage />);

        // No request button before a target is checked.
        expect(screen.queryByRole('button', { name: /Request update for this instance/i })).not.toBeInTheDocument();

        const panel = within(screen.getByTestId('update-availability'));
        // First "Use latest" is the core row.
        fireEvent.click(panel.getAllByRole('button', { name: /Use latest/i })[0]!);

        expect(screen.getByTestId('target-version-input')).toHaveValue('0.2.0');
        // The preflight ran, so the (still preflight-gated) request button appears.
        expect(screen.getByRole('button', { name: /Request update for this instance/i })).toBeInTheDocument();
    });

    it('reports it could not check for updates when the registry is unreachable', () => {
        state.releases = { available: false, current_version: '0.1.0', releases: [] };
        state.frontendReleases = { available: false, current_version: '0.1.5', releases: [] };
        state.mobilePreviewReleases = { available: false, current_version: '0.1.0', releases: [] };

        renderWithProviders(<SystemMaintenancePage />);

        const panel = within(screen.getByTestId('update-availability'));
        expect(panel.getByText('Could not check')).toBeInTheDocument();
        expect(panel.getByText(/newest available version could not be determined/i)).toBeInTheDocument();
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

        fireEvent.change(screen.getByTestId('target-version-input'), { target: { value: '0.2.0' } });
        fireEvent.click(screen.getByRole('button', { name: /Check compatibility/i }));

        const requestButton = screen.getByRole('button', { name: /Request update for this instance/i });
        expect(requestButton).toBeEnabled();

        fireEvent.click(requestButton);

        expect(state.requestMutate).toHaveBeenCalledTimes(1);
        const body = state.requestMutate.mock.calls[0][0];
        // Hard rule: the browser never sends an instance_id.
        expect(body).not.toHaveProperty('instance_id');
        expect(body.target_version).toBe('0.2.0');
        expect(body.preflight_id).toBe('pf-qa-001');
        expect(body.accepted_migration_risk).toBe(false);
    });

    it('disables the request button when the preflight is blocked', () => {
        state.preflight = preflight({
            status: 'blocked',
            checks: [{ code: 'downgrade', severity: 'error', message: 'Downgrades are not supported.' }],
        });

        renderWithProviders(<SystemMaintenancePage />);
        fireEvent.change(screen.getByTestId('target-version-input'), { target: { value: '0.2.0' } });
        fireEvent.click(screen.getByRole('button', { name: /Check compatibility/i }));

        expect(screen.getByRole('button', { name: /Request update for this instance/i })).toBeDisabled();
        expect(screen.getByText(/This update is blocked/i)).toBeInTheDocument();
    });

    it('renders the standardized compatibility-error fields on a blocked plugin check', () => {
        // The core-update preflight blocks on an installed (pinned) plugin whose
        // required core range does not admit the target. The UI must surface the
        // standardized compatibility-error fields (component, required range,
        // pinned hint), not just the human message — so the admin knows which
        // component blocks the update and what to do about it.
        state.preflight = preflight({
            status: 'blocked',
            checks: [
                {
                    code: 'plugin_compatibility',
                    severity: 'error',
                    message:
                        'Plugin sh2-shp-survey-js requires SelfHelp >=0.1.0 <0.2.0 and is not compatible with target version 0.2.0 (current 0.1.0).',
                    component: 'plugin',
                    component_id: 'sh2-shp-survey-js',
                    current_version: '0.1.0',
                    target_version: '0.2.0',
                    required_range: '>=0.1.0 <0.2.0',
                    blocking: true,
                    pinned: true,
                },
            ],
        });

        renderWithProviders(<SystemMaintenancePage />);
        fireEvent.change(screen.getByTestId('target-version-input'), { target: { value: '0.2.0' } });
        fireEvent.click(screen.getByRole('button', { name: /Check compatibility/i }));

        // The blocking component badge ("plugin: <id>") is rendered as its own node.
        expect(
            screen.getAllByText((_content, el) => el?.textContent === 'plugin: sh2-shp-survey-js').length,
        ).toBeGreaterThan(0);
        // The required core range is shown as a standalone <Code> (exact match, so it
        // does NOT match the longer human message that also embeds the range).
        expect(screen.getByText('>=0.1.0 <0.2.0')).toBeInTheDocument();
        // The pinned plugin gets an explicit "unpin to update" affordance.
        expect(screen.getByText(/unpin to update/i)).toBeInTheDocument();
    });

    it('hides the request button for an admin without admin.system.update', () => {
        state.canUpdate = false;

        renderWithProviders(<SystemMaintenancePage />);
        fireEvent.change(screen.getByTestId('target-version-input'), { target: { value: '0.2.0' } });
        fireEvent.click(screen.getByRole('button', { name: /Check compatibility/i }));

        expect(screen.queryByRole('button', { name: /Request update for this instance/i })).not.toBeInTheDocument();
        expect(screen.getByText(/need the/i)).toBeInTheDocument();
    });

    it('warns when a requested update sits unclaimed by the manager (stale)', () => {
        // Backend flags the operation as stale: requested 10+ minutes ago, the
        // manager loop never polled. The page must say so instead of showing a
        // silent 0% progress bar, and give the wrapper-aware recovery command.
        state.status = {
            ...idleStatus(),
            operation_id: 'op_qa_42',
            status: 'requested',
            target_version: '0.2.0',
            manager: { configured: true, last_seen_at: null, requested_stale: true },
        };

        renderWithProviders(<SystemMaintenancePage />);

        expect(screen.getByText(/The SelfHelp Manager has not picked this up/i)).toBeInTheDocument();
        expect(screen.getByText(/no manager has ever polled this instance/i)).toBeInTheDocument();
        expect(screen.getByText('sh-manager instance process-operations qa-instance')).toBeInTheDocument();
        // Wrapper-aware note so operators on the wrapper do not copy a broken command.
        expect(screen.getAllByText('./shm.ps1').length).toBeGreaterThan(0);
    });

    it('explains a missing manager token in the stale warning', () => {
        state.status = {
            ...idleStatus(),
            operation_id: 'op_qa_43',
            status: 'requested',
            target_version: '0.2.0',
            manager: { configured: false, last_seen_at: null, requested_stale: true },
        };

        renderWithProviders(<SystemMaintenancePage />);

        expect(screen.getByText(/SELFHELP_MANAGER_TOKEN/)).toBeInTheDocument();
        expect(screen.getByText('sh-manager instance update qa-instance')).toBeInTheDocument();
    });

    it('does not warn while a fresh requested operation waits within the grace window', () => {
        state.status = {
            ...idleStatus(),
            operation_id: 'op_qa_44',
            status: 'requested',
            target_version: '0.2.0',
            manager: { configured: true, last_seen_at: '2026-06-08T00:00:00Z', requested_stale: false },
        };

        renderWithProviders(<SystemMaintenancePage />);

        expect(screen.queryByText(/has not picked this up/i)).not.toBeInTheDocument();
    });

    it('renders the manager_loop health component with a readable name', () => {
        state.health = {
            ...health(),
            overall: 'degraded',
            components: [
                { name: 'database', status: 'ok', detail: 'reachable' },
                { name: 'manager_loop', status: 'down', detail: 'Manager token is configured but no manager has ever polled this instance.' },
            ],
        };

        renderWithProviders(<SystemMaintenancePage />);

        // Underscored component names render as words (capitalized via CSS).
        expect(screen.getByText('manager loop')).toBeInTheDocument();
        expect(screen.getByText(/no manager has ever polled/i)).toBeInTheDocument();
    });

    it('feeds the frontend-only picker from the registry frontend releases and excludes the current frontend version', () => {
        renderWithProviders(<SystemMaintenancePage />);

        const input = screen.getByTestId('frontend-target-version-input');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: '0.' } });
        // 0.1.7 is offered; the currently installed frontend 0.1.5 is not.
        expect(screen.getByRole('option', { name: '0.1.7' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: '0.1.5' })).not.toBeInTheDocument();
    });

    it('runs a frontend preflight then requests a frontend-only update with NO instance_id and NO migration risk', () => {
        renderWithProviders(<SystemMaintenancePage />);

        // No frontend preflight yet, so no frontend request button.
        expect(
            screen.queryByRole('button', { name: /Request frontend update for this instance/i }),
        ).not.toBeInTheDocument();

        fireEvent.change(screen.getByTestId('frontend-target-version-input'), { target: { value: '0.1.7' } });
        fireEvent.click(screen.getByRole('button', { name: /Check frontend compatibility/i }));

        const requestButton = screen.getByRole('button', { name: /Request frontend update for this instance/i });
        expect(requestButton).toBeEnabled();

        fireEvent.click(requestButton);

        expect(state.frontendRequestMutate).toHaveBeenCalledTimes(1);
        const body = state.frontendRequestMutate.mock.calls[0][0];
        // Hard rules for a frontend swap: no instance_id, no migration-risk fields.
        expect(body).not.toHaveProperty('instance_id');
        expect(body).not.toHaveProperty('accepted_migration_risk');
        expect(body).not.toHaveProperty('typed_confirmation');
        expect(body.target_version).toBe('0.1.7');
        expect(body.preflight_id).toBe('fe-pf-qa-001');
    });

    it('disables the frontend request button when the frontend preflight is blocked', () => {
        state.frontendPreflight = frontendPreflight({
            status: 'blocked',
            checks: [{ code: 'downgrade', severity: 'error', message: 'Frontend downgrades are not supported.' }],
        });

        renderWithProviders(<SystemMaintenancePage />);
        fireEvent.change(screen.getByTestId('frontend-target-version-input'), { target: { value: '0.1.3' } });
        fireEvent.click(screen.getByRole('button', { name: /Check frontend compatibility/i }));

        expect(screen.getByRole('button', { name: /Request frontend update for this instance/i })).toBeDisabled();
        expect(screen.getByText(/This frontend update is blocked/i)).toBeInTheDocument();
    });

    it('hides the frontend request button for an admin without admin.system.update', () => {
        state.canUpdate = false;

        renderWithProviders(<SystemMaintenancePage />);
        fireEvent.change(screen.getByTestId('frontend-target-version-input'), { target: { value: '0.1.7' } });
        fireEvent.click(screen.getByRole('button', { name: /Check frontend compatibility/i }));

        expect(
            screen.queryByRole('button', { name: /Request frontend update for this instance/i }),
        ).not.toBeInTheDocument();
        // The notice text is split by a <Code> node, so match the trailing segment.
        expect(screen.getByText(/permission to request a frontend update/i)).toBeInTheDocument();
    });

    it('shows the planned update steps in advance and advances them live before the manager reports details', () => {
        // Regression: while an update runs the manager only writes back its
        // detailed `steps` at the very end, so the operator used to see nothing
        // happening. The page must show the planned checklist up front and tick
        // it from the coarse lifecycle status — like the manager's own console.
        state.status = {
            ...idleStatus(),
            operation_id: 'op_qa_live',
            status: 'backup_running',
            target_version: '0.2.0',
            progress_percent: 25,
            steps: [], // manager has not reported per-step detail yet
        };

        renderWithProviders(<SystemMaintenancePage />);

        // The whole core plan is visible in advance...
        expect(screen.getByText(/Planned steps/i)).toBeInTheDocument();
        expect(screen.getByText('Resolve & plan update')).toBeInTheDocument();
        expect(screen.getByText('Pre-update backup')).toBeInTheDocument();
        expect(screen.getByText('Run database migrations')).toBeInTheDocument();
        expect(screen.getByText('Health check')).toBeInTheDocument();
        // ...and the current phase (backup) is shown as in progress.
        expect(screen.getAllByText(/in progress/i).length).toBeGreaterThan(0);
    });

    it('shows the frontend-only plan (no backup/migration rows) for a frontend update', () => {
        state.status = {
            ...idleStatus(),
            operation_id: 'op_qa_fe_live',
            status: 'update_running',
            kind: 'frontend',
            target_version: '0.1.7',
            target_frontend_version: '0.1.7',
            progress_percent: 60,
            steps: [],
        };

        renderWithProviders(<SystemMaintenancePage />);

        expect(screen.getByText('Pull verified frontend image')).toBeInTheDocument();
        expect(screen.getByText('Recreate frontend container')).toBeInTheDocument();
        // A frontend swap is stateless — no backup or DB migration rows.
        expect(screen.queryByText('Pre-update backup')).not.toBeInTheDocument();
        expect(screen.queryByText('Run database migrations')).not.toBeInTheDocument();
    });

    it('prefers the manager-reported detailed steps once they arrive', () => {
        state.status = {
            ...idleStatus(),
            operation_id: 'op_qa_done',
            status: 'succeeded',
            target_version: '0.2.0',
            progress_percent: 100,
            steps: [
                { name: 'pull', status: 'succeeded', detail: 'pulled selfhelp-backend@0.2.0' },
                { name: 'health', status: 'succeeded' },
            ],
        };

        renderWithProviders(<SystemMaintenancePage />);

        // The real per-step report wins over the synthesized plan (detail is
        // rendered inline as "<status>: <detail>", so match on the detail text).
        expect(screen.getByText(/pulled selfhelp-backend@0\.2\.0/)).toBeInTheDocument();
        expect(screen.queryByText(/Planned steps/i)).not.toBeInTheDocument();
    });

    it('locks BOTH update request buttons while an operation is in flight', () => {
        // An active core update is running: the operator must not be able to fire
        // a second (core OR frontend) update on top of it.
        state.status = {
            ...idleStatus(),
            operation_id: 'op_qa_active',
            status: 'update_running',
            target_version: '0.2.0',
            progress_percent: 50,
        };

        renderWithProviders(<SystemMaintenancePage />);

        // Core request button renders but is locked.
        fireEvent.change(screen.getByTestId('target-version-input'), { target: { value: '0.2.0' } });
        fireEvent.click(screen.getByRole('button', { name: /Check compatibility/i }));
        const coreButton = screen.getByRole('button', { name: /Request update for this instance/i });
        expect(coreButton).toBeDisabled();
        // It also visibly spins for the WHOLE operation (not just the POST), so the
        // in-progress state is obvious — matching the plugin install button.
        expect(coreButton).toHaveAttribute('data-loading', 'true');

        // Frontend request button is locked too.
        fireEvent.change(screen.getByTestId('frontend-target-version-input'), { target: { value: '0.1.7' } });
        fireEvent.click(screen.getByRole('button', { name: /Check frontend compatibility/i }));
        const frontendButton = screen.getByRole('button', { name: /Request frontend update for this instance/i });
        expect(frontendButton).toBeDisabled();
        expect(frontendButton).toHaveAttribute('data-loading', 'true');

        // The operator is told why the buttons are locked (shown in both sections).
        expect(screen.getAllByText(/An update is already in progress/i).length).toBeGreaterThan(0);
    });

    it('shows the mobile-preview version in the summary and "Not installed" when the instance has none', () => {
        renderWithProviders(<SystemMaintenancePage />);
        // The summary + Updates card both label the row "Mobile preview".
        expect(screen.getAllByText('Mobile preview').length).toBeGreaterThan(0);
        // Installed by default (0.1.0): no "Not installed" badge in the summary.
        expect(screen.queryByText('Not installed')).not.toBeInTheDocument();

        state.version = { ...version(), mobile_preview_version: 'unknown' };
        state.mobilePreviewReleases = { available: true, current_version: 'unknown', releases: [{ version: '0.1.0', channel: 'stable', blocked: false }] };
        renderWithProviders(<SystemMaintenancePage />);
        expect(screen.getByText('Not installed')).toBeInTheDocument();
    });

    it('offers an Install action and an "Enable mobile preview" request when the preview is not installed', () => {
        state.version = { ...version(), mobile_preview_version: 'unknown' };
        state.mobilePreviewReleases = {
            available: true,
            current_version: 'unknown',
            releases: [{ version: '0.1.0', channel: 'stable', blocked: false }],
        };
        state.mobilePreviewPreflight = mobilePreviewPreflight({ current_version: 'unknown', target_version: '0.1.0' });

        renderWithProviders(<SystemMaintenancePage />);

        // The availability panel surfaces an Install (not "Use latest") affordance.
        const panel = within(screen.getByTestId('update-availability'));
        expect(panel.getByText('Install: 0.1.0')).toBeInTheDocument();

        // The dedicated section requests an ENABLE (bootstrap), not an update.
        fireEvent.change(screen.getByTestId('mobile-preview-target-version-input'), { target: { value: '0.1.0' } });
        fireEvent.click(screen.getByRole('button', { name: /Check mobile preview compatibility/i }));
        expect(screen.getByRole('button', { name: /Enable mobile preview for this instance/i })).toBeInTheDocument();
    });

    it('runs a mobile-preview preflight then requests a preview-only update with NO instance_id and NO migration risk', () => {
        state.mobilePreviewReleases = {
            available: true,
            current_version: '0.1.0',
            releases: [
                { version: '0.2.3', channel: 'stable', blocked: false },
                { version: '0.1.0', channel: 'stable', blocked: false },
            ],
        };

        renderWithProviders(<SystemMaintenancePage />);

        expect(
            screen.queryByRole('button', { name: /Request mobile-preview update for this instance/i }),
        ).not.toBeInTheDocument();

        fireEvent.change(screen.getByTestId('mobile-preview-target-version-input'), { target: { value: '0.2.3' } });
        fireEvent.click(screen.getByRole('button', { name: /Check mobile preview compatibility/i }));

        const requestButton = screen.getByRole('button', { name: /Request mobile-preview update for this instance/i });
        expect(requestButton).toBeEnabled();

        fireEvent.click(requestButton);

        expect(state.mobilePreviewRequestMutate).toHaveBeenCalledTimes(1);
        const body = state.mobilePreviewRequestMutate.mock.calls[0][0];
        // Hard rules for a preview swap: no instance_id, no migration-risk fields.
        expect(body).not.toHaveProperty('instance_id');
        expect(body).not.toHaveProperty('accepted_migration_risk');
        expect(body.target_version).toBe('0.2.3');
        expect(body.preflight_id).toBe('mp-pf-qa-001');
    });

    it('disables the mobile-preview request button when the preflight is blocked', () => {
        state.mobilePreviewPreflight = mobilePreviewPreflight({
            status: 'blocked',
            checks: [{ code: 'mobile_preview_compatibility', severity: 'error', message: 'The target preview requires a newer core.' }],
        });

        renderWithProviders(<SystemMaintenancePage />);
        fireEvent.change(screen.getByTestId('mobile-preview-target-version-input'), { target: { value: '0.2.3' } });
        fireEvent.click(screen.getByRole('button', { name: /Check mobile preview compatibility/i }));

        expect(screen.getByRole('button', { name: /Request mobile-preview update for this instance/i })).toBeDisabled();
        expect(screen.getByText(/This mobile-preview update is blocked/i)).toBeInTheDocument();
    });

    it('hides the mobile-preview request button for an admin without admin.system.update', () => {
        state.canUpdate = false;

        renderWithProviders(<SystemMaintenancePage />);
        fireEvent.change(screen.getByTestId('mobile-preview-target-version-input'), { target: { value: '0.2.3' } });
        fireEvent.click(screen.getByRole('button', { name: /Check mobile preview compatibility/i }));

        expect(
            screen.queryByRole('button', { name: /Request mobile-preview update for this instance/i }),
        ).not.toBeInTheDocument();
        expect(screen.getByText(/permission to request a mobile-preview update/i)).toBeInTheDocument();
    });

    it('shows the mobile-preview-only plan (no backup/migration rows) for a mobile-preview update', () => {
        state.status = {
            ...idleStatus(),
            operation_id: 'op_qa_mp_live',
            status: 'update_running',
            kind: 'mobile-preview',
            target_version: '0.2.3',
            target_mobile_preview_version: '0.2.3',
            progress_percent: 60,
            steps: [],
        };

        renderWithProviders(<SystemMaintenancePage />);

        expect(screen.getByText('Pull verified mobile-preview image')).toBeInTheDocument();
        expect(screen.getByText('Recreate mobile-preview container')).toBeInTheDocument();
        // A preview swap is stateless — no backup or DB migration rows.
        expect(screen.queryByText('Pre-update backup')).not.toBeInTheDocument();
        expect(screen.queryByText('Run database migrations')).not.toBeInTheDocument();
    });
});
