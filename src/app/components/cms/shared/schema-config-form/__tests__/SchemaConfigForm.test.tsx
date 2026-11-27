/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { AdminDataAccessApi } from '../../../../../../api/admin/data-access.api';
import { SchemaConfigForm } from '../SchemaConfigForm';

vi.mock('../../../../../../api/admin/data-access.api', () => ({
    AdminDataAccessApi: {
        getPluginResources: vi.fn(async () => [
            { id: 12, name: 'Intake script', description: null },
            { id: 99, name: 'Other script', description: null },
        ]),
    },
}));

describe('SchemaConfigForm (P8-A1 resource picker)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads the viewable resource list for resource_fields and saves typed values', async () => {
        const onChange = vi.fn();
        renderWithProviders(
            <SchemaConfigForm
                schema={{
                    type: 'object',
                    properties: {
                        script_id: { type: 'integer', title: 'Script' },
                        note: { type: 'string', title: 'Note' },
                    },
                    required: ['script_id'],
                }}
                resourceFields={{ script_id: 'rserve_script' }}
                value={{ script_id: 12 }}
                onChange={onChange}
            />,
        );

        expect(await screen.findByText('Script')).toBeInTheDocument();
        await waitFor(() => {
            expect(AdminDataAccessApi.getPluginResources).toHaveBeenCalledWith('rserve_script');
        });

        // Combobox shows the selected viewable item label once options resolve.
        await waitFor(() => {
            expect(screen.getByDisplayValue('Intake script')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText(/^Note$/), { target: { value: 'hello' } });
        await waitFor(() => {
            const last = onChange.mock.calls.at(-1)?.[0] as Record<string, unknown>;
            expect(last).toMatchObject({ script_id: 12, note: 'hello' });
        });
    });
});
