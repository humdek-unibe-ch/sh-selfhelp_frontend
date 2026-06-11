/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * The login page must offer a discoverable path to self-registration. This test
 * pins that the "Create account" link is rendered and points at the public
 * /register route so users without an account can reach the registration form.
 */
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
    useSearchParams: () => ({ get: () => null }),
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

        expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/reset-password');
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
});
