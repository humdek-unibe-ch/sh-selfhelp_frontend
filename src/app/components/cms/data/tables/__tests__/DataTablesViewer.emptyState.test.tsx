/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';

/**
 * L3: with tables present but none picked, the viewer claimed
 * "No data tables available".
 */
const useDataTables = vi.fn();
vi.mock('../../../../../../hooks/useData', () => ({
    useDataTables: () => useDataTables(),
}));
vi.mock('../SingleDataTable', () => ({ default: () => null }));

import { DataTablesViewer } from '../DataTablesViewer';

const props = { selectedUserId: -1, showDeleted: false, selectedLanguageId: 1 };

describe('DataTablesViewer empty state', () => {
    it('asks to pick tables when tables exist but none are selected', () => {
        useDataTables.mockReturnValue({ data: { dataTables: [{ id: 1, name: '1', displayName: 'Contact' }] }, isLoading: false });
        renderWithProviders(<DataTablesViewer activeTableIds={[]} {...props} />);

        expect(screen.getByText('No data tables selected')).toBeInTheDocument();
        expect(screen.queryByText('No data tables available')).not.toBeInTheDocument();
    });

    it('says no tables are available when none exist', () => {
        useDataTables.mockReturnValue({ data: { dataTables: [] }, isLoading: false });
        renderWithProviders(<DataTablesViewer activeTableIds={[]} {...props} />);

        expect(screen.getByText('No data tables available')).toBeInTheDocument();
    });
});
