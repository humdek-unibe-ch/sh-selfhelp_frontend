/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * Higher-risk subject (Slice 6): the AdminShell gate. It must render the admin
 * area only for an authenticated session and otherwise render nothing while
 * redirecting to login. Hooks/children are mocked so the test isolates the gate.
 */
const { authState, replaceMock } = vi.hoisted(() => ({
    authState: { value: { isAuthenticated: true, isLoading: false, isBackendUnavailable: false } },
    replaceMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace: replaceMock, push: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('../../../../../hooks/useUserData', () => ({
    useAuthStatus: () => authState.value,
}));
vi.mock('../../../../store/ui.store', () => ({
    useIsSidebarCollapsed: () => false,
}));
vi.mock('../admin-navbar/AdminNavbar', () => ({
    AdminNavbar: () => <div data-testid="admin-navbar" />,
}));
vi.mock('../../../shared/common/debug', () => ({
    DebugMenu: () => null,
}));

import { AdminShell } from '../AdminShell';

describe('AdminShell gate', () => {
    beforeEach(() => {
        replaceMock.mockClear();
        authState.value = { isAuthenticated: true, isLoading: false, isBackendUnavailable: false };
    });

    it('renders children for an authenticated session', () => {
        authState.value = { isAuthenticated: true, isLoading: false, isBackendUnavailable: false };

        renderWithProviders(
            <AdminShell>
                <div>admin-content</div>
            </AdminShell>,
        );

        expect(screen.getByText('admin-content')).toBeInTheDocument();
        expect(replaceMock).not.toHaveBeenCalled();
    });

    it('renders nothing and redirects to login when genuinely unauthenticated', () => {
        authState.value = { isAuthenticated: false, isLoading: false, isBackendUnavailable: false };

        renderWithProviders(
            <AdminShell>
                <div>admin-content</div>
            </AdminShell>,
        );

        expect(screen.queryByText('admin-content')).not.toBeInTheDocument();
        expect(replaceMock).toHaveBeenCalled();
    });

    it('stays put (renders children, no redirect) during a transient backend outage', () => {
        // Manager is restarting Symfony for a plugin/system operation: user-data
        // is briefly unavailable so `isAuthenticated` is false, but the outage is
        // transient. The operator must NOT be bounced to login.
        authState.value = { isAuthenticated: false, isLoading: false, isBackendUnavailable: true };

        renderWithProviders(
            <AdminShell>
                <div>admin-content</div>
            </AdminShell>,
        );

        expect(screen.getByText('admin-content')).toBeInTheDocument();
        expect(replaceMock).not.toHaveBeenCalled();
    });
});
