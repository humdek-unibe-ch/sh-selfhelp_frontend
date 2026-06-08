/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';

/**
 * Regression guard (canonical Testing Rule 2) for the "No Access to Data Tables"
 * alert. It previously keyed off `!hasTables` (the tables list being empty),
 * which fired during loading and whenever a user simply had no tables — a false
 * "no access" warning. It now keys off the real permission check
 * (`useCanAccessDataBrowser`). These tests pin: alert shows iff the permission
 * is absent, independent of how many tables exist.
 */
const state = vi.hoisted(() => ({ canAccess: true, tables: [] as { id: number; name: string; displayName: string }[] }));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));
vi.mock('../../../../../../hooks/usePermissionChecks', () => ({
    useCanAccessDataBrowser: () => state.canAccess,
}));
vi.mock('../../../../../../hooks/useData', () => ({
    useDataTables: () => ({ data: { dataTables: state.tables }, refetch: vi.fn(), isFetching: false }),
}));
vi.mock('../../../../../../hooks/useUsers', () => ({
    useUsers: () => ({ data: { users: [] }, refetch: vi.fn() }),
}));
vi.mock('../../../../../../hooks/useLanguages', () => ({
    usePublicLanguages: () => ({ languages: [], refetch: vi.fn() }),
}));
// Keep the test focused on the alert/permission gate, not child chrome.
vi.mock('../../tables/DataTablesViewer', () => ({ DataTablesViewer: () => <div data-testid="viewer" /> }));
vi.mock('../../modals/BulkExportModal', () => ({ BulkExportModal: () => null }));
vi.mock('../../../../shared/common/FilterControls', () => ({ FilterActions: () => <div data-testid="filters" /> }));
vi.mock('../../../../shared/common/PageHeader', () => ({
    PageHeader: ({ title, children }: { title: string; children?: React.ReactNode }) => (
        <div><h2>{title}</h2>{children}</div>
    ),
}));

import { DataAdminPage } from '../DataAdminPage';

const ALERT = /No Access to Data Tables/i;

describe('DataAdminPage — data-access alert', () => {
    beforeEach(() => {
        state.canAccess = true;
        state.tables = [];
    });

    it('does NOT show the no-access alert when the user has data-browser permission and no tables', () => {
        state.canAccess = true;
        state.tables = [];
        renderWithProviders(<DataAdminPage />);
        expect(screen.queryByText(ALERT)).not.toBeInTheDocument();
    });

    it('shows the no-access alert only when the permission is absent', () => {
        state.canAccess = false;
        renderWithProviders(<DataAdminPage />);
        expect(screen.getByText(ALERT)).toBeInTheDocument();
    });

    it('keeps the alert hidden for a permitted user who has tables', () => {
        state.canAccess = true;
        state.tables = [{ id: 1, name: '218', displayName: 'Survey A' }];
        renderWithProviders(<DataAdminPage />);
        expect(screen.queryByText(ALERT)).not.toBeInTheDocument();
    });
});
