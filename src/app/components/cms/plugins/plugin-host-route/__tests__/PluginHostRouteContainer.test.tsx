/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PluginHostRouteContainer } from '../PluginHostRouteContainer';

const permissions = vi.hoisted(() => ({ held: [] as string[] }));

vi.mock('../../../../../../hooks/useAuth', () => ({
    useAuth: () => ({ hasPermission: (permission: string) => permissions.held.includes(permission) }),
}));

vi.mock('../../../../frontend/plugin-runtime', () => ({
    usePluginRuntime: () => ({
        isLoading: false,
        snapshot: {
            plugins: [{ id: 'qa-plugin' }],
            adminPages: [
                { pluginId: 'qa-plugin', slug: 'items', title: 'Items', permission: 'qa.items.update', component: () => <p>Plugin page body</p> },
                { pluginId: 'qa-plugin', slug: 'open', title: 'Open', component: () => <p>Open page body</p> },
            ],
        },
    }),
}));

describe('PluginHostRouteContainer', () => {
    beforeEach(() => {
        permissions.held = ['admin.access'];
    });

    it('refuses a plugin page to a user without the permission the page declares', () => {
        renderWithProviders(<PluginHostRouteContainer pluginId="qa-plugin" slug="items" />);

        expect(screen.getByText('No access')).toBeInTheDocument();
        expect(screen.getByText('qa.items.update')).toBeInTheDocument();
        expect(screen.queryByText('Plugin page body')).not.toBeInTheDocument();
    });

    it('opens the plugin page for a user who holds its permission', () => {
        permissions.held = ['admin.access', 'qa.items.update'];
        renderWithProviders(<PluginHostRouteContainer pluginId="qa-plugin" slug="items" />);

        expect(screen.getByText('Plugin page body')).toBeInTheDocument();
    });

    it('opens a plugin page that declares no permission', () => {
        renderWithProviders(<PluginHostRouteContainer pluginId="qa-plugin" slug="open" />);

        expect(screen.getByText('Open page body')).toBeInTheDocument();
    });
});
