/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type { IPluginSettingViewItem } from '@selfhelp/shared/plugin-sdk';

const state = vi.hoisted(() => ({
    items: [] as IPluginSettingViewItem[],
    mutate: vi.fn(),
}));

vi.mock('../../hooks/usePluginJobTypes', () => ({
    usePluginSettings: () => ({ data: state.items, isLoading: false, error: null }),
    useUpdatePluginSettings: () => ({
        mutate: state.mutate,
        isPending: false,
    }),
}));

import { PluginSettingsForm } from '../PluginSettingsForm';

describe('PluginSettingsForm (P8-A2)', () => {
    beforeEach(() => {
        state.mutate.mockReset();
        state.items = [
            {
                key: 'api_key',
                label: 'API key',
                type: 'string',
                secret: true,
                required: true,
                has_value: true,
                value: null,
                hint: '9xyz',
                overridden_by_env: false,
            },
            {
                key: 'base_url',
                label: 'Base URL',
                type: 'url',
                secret: false,
                required: false,
                has_value: true,
                value: 'https://example.com',
                hint: null,
                overridden_by_env: true,
            },
        ];
    });

    it('shows the secret hint, omits untouched secrets, clears with null, and disables env overrides', async () => {
        renderWithProviders(<PluginSettingsForm pluginId="sh2-shp-llm" />);

        expect(await screen.findByText(/Key: …9xyz/)).toBeInTheDocument();
        expect(screen.getByLabelText('Base URL')).toBeDisabled();
        expect(screen.getByText(/Overridden by environment variable/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
        await waitFor(() => {
            expect(state.mutate).toHaveBeenCalled();
            const body = state.mutate.mock.calls[0][0] as Record<string, unknown>;
            expect(body).not.toHaveProperty('api_key');
            expect(body).not.toHaveProperty('base_url');
        });

        state.mutate.mockClear();
        fireEvent.click(screen.getByRole('button', { name: 'Clear secret' }));
        fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
        await waitFor(() => {
            const body = state.mutate.mock.calls[0][0] as Record<string, unknown>;
            expect(body.api_key).toBeNull();
        });
    });
});
