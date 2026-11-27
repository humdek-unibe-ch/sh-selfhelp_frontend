/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { formatPluginLifecycleError } from '../../hooks/pluginLifecycleError';

const state = vi.hoisted(() => ({
    held: new Set<string>(['admin.plugins.manage', 'admin.plugins.execute']),
    detail: {
        pluginId: 'sh2-shp-llm',
        name: 'LLM',
        version: '1.0.0',
        pluginApiVersion: '0.2.0',
        trustLevel: 'official',
        installMode: 'managed',
        enabled: true,
        installedAt: '2026-01-01',
        updatedAt: '2026-01-01',
        capabilities: [],
        manifest: {
            dependencies: [
                { pluginId: 'sh2-shp-r-serve', version: '^1.0.0', required: true },
            ],
            listens: ['record.saved', 'page.published'],
            recurringJobs: [
                { name: 'nightly', type: 'r_script', cron: '0 2 * * *', description: 'Nightly run' },
            ],
            settings: [{ key: 'api_key', label: 'API key', type: 'string', secret: true }],
        } as Record<string, unknown>,
    },
    installed: {
        plugins: [
            { pluginId: 'sh2-shp-r-serve', enabled: true, version: '1.2.0' },
        ],
    },
}));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({
        permissionChecker: { hasPermission: (name: string) => state.held.has(name) },
    }),
}));

vi.mock('../../hooks/useAdminPlugins', () => ({
    useAdminPlugin: () => ({ data: state.detail, isLoading: false, error: null }),
    useAdminPlugins: () => ({ data: state.installed, isLoading: false }),
    useAdminPluginHealth: () => ({ data: null }),
    useAdminPluginOperations: () => ({ data: [] }),
    useAdminPluginEnable: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useAdminPluginDisable: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useAdminPluginUninstall: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useAdminPluginPurge: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useAdminPluginRollback: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useAdminPluginUpdate: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useAdminPluginFeatureFlagSet: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../hooks/usePluginJobTypes', () => ({
    usePluginSettings: () => ({
        data: [{
            key: 'api_key',
            label: 'API key',
            type: 'string',
            secret: true,
            required: true,
            has_value: true,
            value: null,
            hint: 'abcd',
            overridden_by_env: false,
        }],
        isLoading: false,
        error: null,
    }),
    useUpdatePluginSettings: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

import { PluginDetailPage } from '../PluginDetailPage';

describe('PluginDetailPage C21/C24/C25 (P8-A5)', () => {
    beforeEach(() => {
        state.held = new Set(['admin.plugins.manage', 'admin.plugins.execute']);
    });

    it('shows dependency state, listens, recurring jobs, and settings', async () => {
        renderWithProviders(<PluginDetailPage pluginId="sh2-shp-llm" />);

        expect(await screen.findByTestId('plugin-dependencies')).toBeInTheDocument();
        expect(screen.getByText('sh2-shp-r-serve')).toBeInTheDocument();
        expect(screen.getByText(/enabled \(v1\.2\.0\)/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('tab', { name: /Events/i }));
        expect(await screen.findByTestId('plugin-listens')).toBeInTheDocument();
        expect(screen.getByText('record.saved')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('tab', { name: /Recurring jobs/i }));
        expect(await screen.findByTestId('plugin-recurring-jobs')).toBeInTheDocument();
        expect(screen.getByText('nightly')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('plugin-settings-tab'));
        expect(await screen.findByTestId('plugin-settings-form')).toBeInTheDocument();
    });

    it('renders when manifest.lookups uses the documented extends object', async () => {
        const previous = state.detail.manifest;
        state.detail.manifest = {
            ...previous,
            lookups: {
                extends: [
                    {
                        typeCode: 'resourceTypes',
                        ownership: 'plugin_extendable',
                        entries: [{ code: 'qa_live_item', value: 'QA live item' }],
                    },
                ],
            },
        };
        try {
            renderWithProviders(<PluginDetailPage pluginId="sh2-shp-llm" />);
            expect(await screen.findByRole('tab', { name: /Events/i })).toBeInTheDocument();
            fireEvent.click(screen.getByRole('tab', { name: /Events/i }));
            expect(await screen.findByTestId('plugin-listens')).toBeInTheDocument();
            fireEvent.click(screen.getByRole('tab', { name: /Lookups/i }));
            expect(await screen.findByText('qa_live_item')).toBeInTheDocument();
        } finally {
            state.detail.manifest = previous;
        }
    });

    it('formats 409 dependency errors with plugin names', () => {
        const message = formatPluginLifecycleError({
            response: {
                status: 409,
                data: {
                    error: 'plugin_dependency_missing',
                    data: { unmet: [{ plugin_id: 'sh2-shp-r-serve', version: '^1.0.0', reason: 'missing' }] },
                },
            },
        });
        expect(message).toContain('sh2-shp-r-serve');
    });
});
