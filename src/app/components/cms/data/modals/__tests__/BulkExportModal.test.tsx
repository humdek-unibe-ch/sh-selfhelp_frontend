/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type { IDataTableSummary } from '../../../../../../types/responses/admin/data.types';

/**
 * The bulk-export modal lets an admin pick tables + a format and fires a single
 * ZIP export. The export hook is mocked (no real outbound / no download); the
 * test pins the UX contract: the primary action is disabled until a table is
 * chosen, and on submit the modal calls the hook with the selected table NAMES
 * (not ids) and the chosen format.
 */
const { mutateAsync, isPending } = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false }));

vi.mock('../../../../../../hooks/useData', () => ({
    useExportTablesZip: () => ({ mutateAsync, isPending }),
}));

import { BulkExportModal } from '../BulkExportModal';

const tables: IDataTableSummary[] = [
    { id: 1, name: '218', displayName: 'Survey A', created: '2026-01-01' },
    { id: 2, name: '219', displayName: 'Survey B', created: '2026-01-01' },
];

function setup(props: Partial<React.ComponentProps<typeof BulkExportModal>> = {}) {
    return renderWithProviders(
        <BulkExportModal open onClose={vi.fn()} tables={tables} {...props} />,
    );
}

describe('BulkExportModal', () => {
    beforeEach(() => {
        mutateAsync.mockReset();
        mutateAsync.mockResolvedValue(undefined);
    });

    it('disables the export action until at least one table is selected', () => {
        setup();
        const exportBtn = screen.getByRole('button', { name: /Export ZIP/i });
        expect(exportBtn).toBeDisabled();
    });

    it('exports the selected table names with the default csv format', async () => {
        const user = userEvent.setup();
        setup();

        // Open the MultiSelect and pick "Survey A".
        await user.click(screen.getByPlaceholderText('Pick tables to export'));
        await user.click(await screen.findByText('Survey A'));

        const exportBtn = screen.getByRole('button', { name: /Export ZIP/i });
        await waitFor(() => expect(exportBtn).toBeEnabled());
        await user.click(exportBtn);

        await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
        // Table NAME ('218'), not id (1); default format csv.
        expect(mutateAsync).toHaveBeenCalledWith({ table_names: ['218'], format: 'csv' });
    });

    it('exports as json when the format toggle is switched', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(screen.getByPlaceholderText('Pick tables to export'));
        await user.click(await screen.findByText('Survey B'));
        await user.click(screen.getByRole('radio', { name: 'JSON' }));

        await user.click(screen.getByRole('button', { name: /Export ZIP/i }));

        await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ table_names: ['219'], format: 'json' }));
    });
});
