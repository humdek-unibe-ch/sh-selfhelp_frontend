/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * The login page must offer a discoverable path to self-registration. This test
 * pins that the "Create account" link is rendered and points at the public
 * /register route so users without an account can reach the registration form.
 *
 * It also pins the already-authenticated guard: the login form must never
 * render on top of a live session.
 */
const { replaceMock, authState, searchParamsState } = vi.hoisted(() => ({
    replaceMock: vi.fn(),
    authState: { value: { isAuthenticated: false, isLoading: false } },
    searchParamsState: { redirectTo: null as string | null },
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
    useSearchParams: () => ({ get: () => searchParamsState.redirectTo }),
}));
vi.mock('../../../../../hooks/useAuth', () => ({
    useAuth: () => authState.value,
}));
vi.mock('@mantine/notifications', () => ({
    notifications: { show: vi.fn() },
}));
vi.mock('../../../../../api/auth.api', () => ({
    AuthApi: { login: vi.fn() },
}));

import LoginStyle from '../LoginStyle';

type LoginStyleField = ComponentProps<typeof LoginStyle>['style'];

describe('LoginStyle', () => {
    beforeEach(() => {
        replaceMock.mockClear();
        authState.value = { isAuthenticated: false, isLoading: false };
        searchParamsState.redirectTo = null;
    });

    it('renders a "Create account" link pointing at the public register route', () => {
        renderWithProviders(
            <LoginStyle style={{} as unknown as LoginStyleField} styleProps={{}} cssClass="section-1" />,
        );

        const registerLink = screen.getByRole('link', { name: 'Create account' });
        expect(registerLink).toBeInTheDocument();
        expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('keeps the password-reset link available alongside registration', () => {
        renderWithProviders(
            <LoginStyle style={{} as unknown as LoginStyleField} styleProps={{}} cssClass="section-1" />,
        );

        // DB-driven routing (issue #30): the canonical reset route is now `/reset`
        // (ROUTES.RESET_PASSWORD), replacing the legacy `/reset-password` path.
        expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/reset');
    });

    it('uses the CMS-provided label for the registration link when set', () => {
        renderWithProviders(
            <LoginStyle
                style={{ label_register: { content: 'Konto erstellen' } } as unknown as LoginStyleField}
                styleProps={{}}
                cssClass="section-1"
            />,
        );

        const registerLink = screen.getByRole('link', { name: 'Konto erstellen' });
        expect(registerLink).toHaveAttribute('href', '/register');
        expect(screen.queryByRole('link', { name: 'Create account' })).not.toBeInTheDocument();
    });

    it('renders the seeded neutral "dark" accent adaptively so it stays readable in dark mode', () => {
        renderWithProviders(
            <LoginStyle
                style={{ color: { content: 'dark' } } as unknown as LoginStyleField}
                styleProps={{}}
                cssClass="section-1"
            />,
        );

        // The neutral accent must invert via theme vars (not a fixed black) so it
        // does not collapse to black-on-black in dark mode.
        const submit = screen.getByRole('button', { name: 'Sign in' });
        expect(submit.getAttribute('style')).toContain('var(--mantine-color-text)');
    });

    it('renders the optional subtitle when set, and hides it when empty', () => {
        const { rerender } = renderWithProviders(
            <LoginStyle
                style={{ subtitle: { content: 'Sign in to continue' } } as unknown as LoginStyleField}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        expect(screen.getByText('Sign in to continue')).toBeInTheDocument();

        rerender(
            <LoginStyle style={{} as unknown as LoginStyleField} styleProps={{}} cssClass="section-1" />,
        );
        expect(screen.queryByText('Sign in to continue')).not.toBeInTheDocument();
    });

    describe('already-authenticated guard', () => {
        // Regression: reaching /login while signed in (typed URL, stale bookmark,
        // or a redirect from another flow such as finishing a different account's
        // activation link) rendered the login form on top of the live session,
        // which reads as a silent logout.
        it('redirects away instead of rendering the form when a session is already active', () => {
            authState.value = { isAuthenticated: true, isLoading: false };

            renderWithProviders(
                <LoginStyle style={{} as unknown as LoginStyleField} styleProps={{}} cssClass="section-1" />,
            );

            expect(replaceMock).toHaveBeenCalledWith('/home');
            expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
        });

        it('honours an explicit redirectTo target for an already-authenticated visitor', () => {
            authState.value = { isAuthenticated: true, isLoading: false };
            searchParamsState.redirectTo = '/admin/pages';

            renderWithProviders(
                <LoginStyle style={{} as unknown as LoginStyleField} styleProps={{}} cssClass="section-1" />,
            );

            expect(replaceMock).toHaveBeenCalledWith('/admin/pages');
        });

        it('still renders the form for an anonymous visitor', () => {
            renderWithProviders(
                <LoginStyle style={{} as unknown as LoginStyleField} styleProps={{}} cssClass="section-1" />,
            );

            expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
            expect(replaceMock).not.toHaveBeenCalled();
        });

        it('does not bounce the visitor while the auth state is still resolving', () => {
            // Guarding on `isAuthenticated` alone would redirect on first paint,
            // before useUserData has answered, and flash away a valid login form.
            authState.value = { isAuthenticated: false, isLoading: true };

            renderWithProviders(
                <LoginStyle style={{} as unknown as LoginStyleField} styleProps={{}} cssClass="section-1" />,
            );

            expect(replaceMock).not.toHaveBeenCalled();
            expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
        });
    });
});
