/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * Higher-risk subject (Slice 6): the AdminShell gate. It must render the admin
 * area only for an authenticated session and otherwise render nothing while
 * redirecting to login. Hooks/children are mocked so the test isolates the gate.
 */
const { authState, replaceMock, sidebarState, toggleSidebarMock, routeState } = vi.hoisted(() => ({
    authState: { value: { isAuthenticated: true, isLoading: false, isBackendUnavailable: false } },
    replaceMock: vi.fn(),
    sidebarState: { collapsed: false },
    toggleSidebarMock: vi.fn(),
    routeState: { pathname: '/admin/users' },
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace: replaceMock, push: vi.fn(), prefetch: vi.fn() }),
    usePathname: () => routeState.pathname,
}));
vi.mock('../../../../../hooks/useUserData', () => ({
    useAuthStatus: () => authState.value,
}));
vi.mock('../../../../store/ui.store', () => ({
    useIsSidebarCollapsed: () => sidebarState.collapsed,
    useToggleSidebarCollapsed: () => toggleSidebarMock,
}));
vi.mock('../admin-navbar/AdminNavbar', () => ({
    AdminNavbar: ({ collapsed }: { collapsed?: boolean }) => (
        <div data-testid="admin-navbar" data-collapsed={String(Boolean(collapsed))} />
    ),
}));
vi.mock('../../../shared/common/debug', () => ({
    DebugMenu: () => null,
}));

import { AdminShell } from '../AdminShell';

describe('AdminShell gate', () => {
    beforeEach(() => {
        replaceMock.mockClear();
        toggleSidebarMock.mockClear();
        sidebarState.collapsed = false;
        routeState.pathname = '/admin/users';
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

    // The pages editor's Splitter sizes its panes with `height: 100%`, which
    // needs a definite-height parent — `max-h-screen` alone is not one.
    it('gives Main a definite height only when fullHeightMain is requested', () => {
        const { unmount } = renderWithProviders(
            <AdminShell fullHeightMain>
                <div>admin-content</div>
            </AdminShell>,
        );

        const fullHeightMain = screen.getByText('admin-content').closest('main');
        expect(fullHeightMain).toHaveStyle({ height: '100dvh' });
        expect(fullHeightMain?.className).not.toContain('max-h-screen');

        unmount();

        renderWithProviders(
            <AdminShell>
                <div>admin-content</div>
            </AdminShell>,
        );

        const defaultMain = screen.getByText('admin-content').closest('main');
        expect(defaultMain?.className).toContain('max-h-screen');
        expect(defaultMain?.style.height).toBe('');
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

    it('shows the navbar as a narrow rail when the sidebar is collapsed on a wide screen', () => {
        sidebarState.collapsed = true;
        const narrowMatchMedia = window.matchMedia;
        window.matchMedia = (query: string) => ({ ...narrowMatchMedia(query), matches: true });

        try {
            renderWithProviders(
                <AdminShell>
                    <div>admin-content</div>
                </AdminShell>,
            );

            const navbar = screen.getByTestId('admin-navbar');
            expect(navbar).toHaveAttribute('data-collapsed', 'true');
            expect(navbar.closest('nav')).toBeVisible();
        } finally {
            window.matchMedia = narrowMatchMedia;
        }
    });

    it('keeps the full navbar on a narrow screen even when the sidebar is collapsed', () => {
        sidebarState.collapsed = true;

        renderWithProviders(
            <AdminShell>
                <div>admin-content</div>
            </AdminShell>,
        );

        expect(screen.getByTestId('admin-navbar')).toHaveAttribute('data-collapsed', 'false');
    });

    it('toggles the sidebar with Ctrl+B', () => {
        renderWithProviders(
            <AdminShell>
                <div>admin-content</div>
            </AdminShell>,
        );

        fireEvent.keyDown(document.documentElement, { key: 'b', code: 'KeyB', ctrlKey: true });

        expect(toggleSidebarMock).toHaveBeenCalledTimes(1);
    });

    it('opens the navbar from the menu button on a narrow screen and closes it after navigating', () => {
        const { rerender } = renderWithProviders(
            <AdminShell>
                <div>admin-content</div>
            </AdminShell>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));

        expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveAttribute('aria-expanded', 'true');

        routeState.pathname = '/admin/groups';
        rerender(
            <AdminShell>
                <div>admin-content</div>
            </AdminShell>,
        );

        expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'false');
    });
});
