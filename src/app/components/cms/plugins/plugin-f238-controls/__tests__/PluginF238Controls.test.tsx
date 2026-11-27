/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';
import { PluginF238DemoButtons } from '../PluginF238Controls';

function checker(...held: string[]) {
    const set = new Set(held);
    return { hasPermission: (name: string) => set.has(name) };
}

describe('PluginF238Controls (P8-A4)', () => {
    it('with only manage, shows no execute control', () => {
        renderWithProviders(
            <PluginF238DemoButtons permissionChecker={checker(PERMISSIONS.ADMIN_PLUGINS_MANAGE)} />,
        );
        expect(screen.queryByTestId('plugin-execute-controls')).not.toBeInTheDocument();
        expect(screen.getByTestId('plugin-manage-controls')).toBeInTheDocument();
        expect(screen.getByTestId('demo-inspect')).toBeInTheDocument();
        expect(screen.getByTestId('demo-settings')).toBeInTheDocument();
    });

    it('with only execute, shows no settings form or inspect archive', () => {
        renderWithProviders(
            <PluginF238DemoButtons permissionChecker={checker(PERMISSIONS.ADMIN_PLUGINS_EXECUTE)} />,
        );
        expect(screen.getByTestId('plugin-execute-controls')).toBeInTheDocument();
        expect(screen.queryByTestId('plugin-manage-controls')).not.toBeInTheDocument();
        expect(screen.queryByTestId('demo-inspect')).not.toBeInTheDocument();
        expect(screen.queryByTestId('demo-settings')).not.toBeInTheDocument();
    });
});
