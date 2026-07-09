/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { EntryFilterField } from '../EntryFilterField';

describe('EntryFilterField', () => {
    it('exposes the SQL builder for entry-list / entry-record filter authoring', async () => {
        const user = userEvent.setup();

        renderWithProviders(
            <EntryFilterField
                fieldId={42}
                value="AND status = 1"
                onChange={() => undefined}
                dataVariables={{ 'route.record_id': 'Record id' }}
            />,
        );

        expect(screen.getByRole('button', { name: /show sql builder/i })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /show sql builder/i }));
        expect(screen.getByRole('button', { name: /hide sql builder/i })).toBeInTheDocument();
    });
});
