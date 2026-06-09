/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Component coverage for the admin "Available plugins" version picker (#49).
 *
 * The unified registry publishes MULTIPLE versions per plugin and the backend
 * resolver classifies each one against this SelfHelp's core/plugin-API version.
 * The picker must NEVER confuse "latest overall" with "latest compatible", so
 * these tests assert the UI contract (Testing Rule 22/26 spirit — the UI
 * enforces the contract, not just the backend):
 *
 *   - the picker defaults to the newest COMPATIBLE version and badges it, while
 *     flagging that a newer-but-incompatible version exists;
 *   - clicking Install posts the SELECTED (compatible) version's `registryEntry`
 *     — proving the default is the compatible release, not the newest overall;
 *   - when nothing is compatible, the standardized `compatibilityError`
 *     (same shape as the core-update preflight) is shown and Install is blocked.
 *
 * The data/mutation hooks are mocked so the test is deterministic and asserts UI
 * behaviour rather than network wiring (the request/response shapes are guarded
 * by the backend schema + the contract test).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type {
    IAdminPluginAvailable,
    IAdminPluginAvailableResponse,
    IAdminPluginAvailableVersion,
} from '../../../../../../types/responses/admin/plugins.types';

const state = vi.hoisted(() => ({
    available: null as IAdminPluginAvailableResponse | null,
    installMutate: vi.fn(),
    refetch: vi.fn(),
}));

vi.mock('../../hooks/useAdminPlugins', () => ({
    useAdminPluginsAvailable: () => ({
        data: state.available,
        isLoading: false,
        error: null,
        refetch: state.refetch,
        isFetching: false,
    }),
    useAdminPluginInstall: () => ({ mutateAsync: state.installMutate }),
}));

vi.mock('@mantine/notifications', () => ({
    notifications: { show: vi.fn() },
}));

import { AvailablePluginsPanel } from '../AvailablePluginsPanel';

function registryEntryFor(version: string): Record<string, unknown> {
    return {
        id: 'sh2-shp-survey-js',
        version,
        channel: 'stable',
        releaseUrl: `releases/plugins/sh2-shp-survey-js-${version}.json`,
    };
}

function compatibleVersion(version: string): IAdminPluginAvailableVersion {
    return {
        version,
        channel: 'stable',
        official: true,
        compatible: true,
        blocking: false,
        selected: true,
        requiredRange: '>=0.1.0 <0.2.0',
        requiredPluginApiRange: '>=0.1.0 <0.2.0',
        reason: null,
        releaseUrl: `releases/plugins/sh2-shp-survey-js-${version}.json`,
        state: 'latest-compatible',
        registryEntry: registryEntryFor(version),
    };
}

function incompatibleVersion(version: string): IAdminPluginAvailableVersion {
    return {
        version,
        channel: 'stable',
        official: true,
        compatible: false,
        blocking: true,
        selected: false,
        requiredRange: '>=0.2.0 <0.3.0',
        requiredPluginApiRange: '>=0.1.0 <0.2.0',
        reason: 'Requires SelfHelp >=0.2.0 <0.3.0 (current 0.1.0).',
        releaseUrl: `releases/plugins/sh2-shp-survey-js-${version}.json`,
        state: 'incompatible',
        registryEntry: registryEntryFor(version),
    };
}

/** A plugin whose newest version (0.2.0) is incompatible but 0.1.0 is compatible. */
function multiVersionEntry(overrides: Partial<IAdminPluginAvailable> = {}): IAdminPluginAvailable {
    const versions = [incompatibleVersion('0.2.0'), compatibleVersion('0.1.0')];
    return {
        sourceName: 'humdek-public',
        pluginId: 'sh2-shp-survey-js',
        name: 'SurveyJS',
        description: 'SurveyJS integration for SelfHelp.',
        version: '0.1.0',
        channel: 'stable',
        trustLevel: 'official',
        homepage: null,
        registryEntry: registryEntryFor('0.1.0'),
        latestVersion: '0.2.0',
        latestCompatibleVersion: '0.1.0',
        selectedVersion: '0.1.0',
        hasCompatibleVersion: true,
        newerExistsButIncompatible: true,
        compatibilityError: null,
        versions,
        ...overrides,
    };
}

describe('AvailablePluginsPanel — multi-version picker', () => {
    beforeEach(() => {
        state.available = { plugins: [multiVersionEntry()] };
        state.installMutate = vi.fn().mockResolvedValue({ data: { id: 4242, installAction: 'install_dispatched' } });
        state.refetch = vi.fn().mockResolvedValue(undefined);
    });

    it('defaults to the newest compatible version and flags the newer incompatible one', () => {
        renderWithProviders(<AvailablePluginsPanel enabledSourcesCount={1} />);

        // The selected version is badged "latest compatible" (not the newest overall).
        expect(screen.getByText('latest compatible')).toBeInTheDocument();
        // A newer-but-incompatible version exists -> the operator is warned.
        expect(screen.getByText('newer incompatible')).toBeInTheDocument();
        // Install is enabled because the SELECTED version is compatible.
        expect(screen.getByRole('button', { name: 'Install' })).toBeEnabled();
    });

    it('installs the selected COMPATIBLE version registry entry, not the newest overall', async () => {
        renderWithProviders(<AvailablePluginsPanel enabledSourcesCount={1} />);

        fireEvent.click(screen.getByRole('button', { name: 'Install' }));

        await waitFor(() => expect(state.installMutate).toHaveBeenCalledTimes(1));
        const body = state.installMutate.mock.calls[0][0] as {
            source: string;
            sourceName: string;
            registryEntry: Record<string, unknown>;
        };
        expect(body.source).toBe('registry');
        expect(body.sourceName).toBe('humdek-public');
        // Hard contract: the default-selected entry is 0.1.0 (newest COMPATIBLE),
        // never the newest-overall 0.2.0 — proving the picker resolves correctly.
        expect(body.registryEntry.version).toBe('0.1.0');
        expect(body.registryEntry.releaseUrl).toBe('releases/plugins/sh2-shp-survey-js-0.1.0.json');
    });

    it('blocks install and surfaces the standardized compatibility error when nothing is compatible', () => {
        state.available = {
            plugins: [
                multiVersionEntry({
                    version: '0.2.0',
                    selectedVersion: null,
                    latestCompatibleVersion: null,
                    hasCompatibleVersion: false,
                    newerExistsButIncompatible: false,
                    registryEntry: registryEntryFor('0.2.0'),
                    versions: [incompatibleVersion('0.2.0')],
                    compatibilityError: {
                        component: 'plugin',
                        component_id: 'sh2-shp-survey-js',
                        current_version: null,
                        target_version: '0.2.0',
                        required_range: '>=0.2.0 <0.3.0',
                        blocking: true,
                        message: 'No published version of sh2-shp-survey-js is compatible with SelfHelp 0.1.0.',
                    },
                }),
            ],
        };

        renderWithProviders(<AvailablePluginsPanel enabledSourcesCount={1} />);

        expect(
            screen.getByText(/No published version of sh2-shp-survey-js is compatible/i),
        ).toBeInTheDocument();
        // The required range is surfaced so the operator knows what core is needed.
        expect(screen.getByText(/requires >=0\.2\.0 <0\.3\.0/i)).toBeInTheDocument();
        // Install is blocked.
        expect(screen.getByRole('button', { name: 'Install' })).toBeDisabled();
    });
});
