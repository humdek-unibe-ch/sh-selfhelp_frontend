/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';

vi.mock('../../../../../../hooks/useConditionBuilderData', () => ({
    useConditionBuilderData: () => ({
        groups: {},
        languages: {},
        platforms: {},
        pages: {},
        isLoading: false,
        isError: false,
        error: null,
    }),
}));

vi.mock('../../../plugins/hooks/usePluginJsonLogicOperations', () => ({
    usePluginJsonLogicOperations: () => ({ data: [], isLoading: false }),
}));

import { ConditionBuilderModal } from '../ConditionBuilderModal';

describe('ConditionBuilderModal plugin operations (P8-A3)', () => {
    it('lists a declared plugin operation in the function list', async () => {
        renderWithProviders(
            <ConditionBuilderModal
                opened
                onClose={vi.fn()}
                onSave={vi.fn()}
                initialValue=""
                pluginOperations={[{ name: 'stats.mean', description: 'Mean of a list of numbers' }]}
            />,
        );

        expect(await screen.findByTestId('plugin-condition-functions')).toBeInTheDocument();
        expect(screen.getByText('stats.mean')).toBeInTheDocument();
        expect(screen.getByText(/Mean of a list of numbers/)).toBeInTheDocument();
    });
});
