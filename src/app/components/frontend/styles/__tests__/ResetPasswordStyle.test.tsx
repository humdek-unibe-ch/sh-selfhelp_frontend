/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * The reset-password section renders two screens from the one style: the
 * "request a link" form at /reset, and the "set a new password" form at
 * /reset/{user_id}/{token} (the link in the recovery email).
 *
 * DB-driven routing (issue #30): the mode is driven by the resolved page's
 * snake_case `route_params` (surfaced via `usePageContentValue`), NOT by parsing
 * the URL slug. Plain `/reset` resolves with no params -> "request a link"; the
 * emailed link resolves with `{ user_id, token }` -> "set a new password". These
 * tests pin that contract and that each form calls the right Auth API.
 */
const { pageContentState, pushMock, authState } = vi.hoisted(() => ({
    pageContentState: { value: undefined as unknown },
    pushMock: vi.fn(),
    authState: { value: { isAuthenticated: false, isLoading: false } },
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('../../../../../hooks/usePageContentValue', () => ({
    usePageContentValue: () => pageContentState.value,
}));
vi.mock('../../../../../hooks/useAuth', () => ({
    useAuth: () => authState.value,
}));
vi.mock('../../../../../api/auth.api', () => ({
    AuthApi: { requestPasswordReset: vi.fn(), resetPassword: vi.fn() },
}));

import ResetPasswordStyle from '../ResetPasswordStyle';
import { AuthApi } from '../../../../../api/auth.api';

type ResetPasswordField = ComponentProps<typeof ResetPasswordStyle>['style'];

/** Set the resolved-page route_params the component reads to pick its mode. */
function withRouteParams(params: Record<string, string> | undefined): void {
    pageContentState.value = params === undefined ? {} : { id: 1, route_params: params };
}

describe('ResetPasswordStyle', () => {
    beforeEach(() => {
        withRouteParams(undefined);
        pushMock.mockClear();
        authState.value = { isAuthenticated: false, isLoading: false };
        vi.mocked(AuthApi.requestPasswordReset).mockReset();
        vi.mocked(AuthApi.resetPassword).mockReset();
    });

    it('requests a reset link from the email form on /reset (no route params)', async () => {
        withRouteParams(undefined);
        vi.mocked(AuthApi.requestPasswordReset).mockResolvedValue({ status: 200, message: 'OK' });

        renderWithProviders(
            <ResetPasswordStyle style={{} as unknown as ResetPasswordField} styleProps={{}} cssClass="section-1" />,
        );

        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'qa@example.test' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

        await waitFor(() => expect(AuthApi.requestPasswordReset).toHaveBeenCalledWith('qa@example.test'));
    });

    it('shows the set-new-password form when route_params carry a user id and token', () => {
        withRouteParams({ user_id: '123', token: 'tok-abc' });

        renderWithProviders(
            <ResetPasswordStyle style={{} as unknown as ResetPasswordField} styleProps={{}} cssClass="section-1" />,
        );

        expect(screen.getByLabelText(/^New password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirm new password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Set new password' })).toBeInTheDocument();
    });

    it('falls back to request mode when the route_params are incomplete (token missing)', () => {
        // `isSetMode` requires BOTH a positive user_id and a non-empty token, so a
        // half-populated link must never expose the set-password form.
        withRouteParams({ user_id: '123' });

        renderWithProviders(
            <ResetPasswordStyle style={{} as unknown as ResetPasswordField} styleProps={{}} cssClass="section-1" />,
        );

        expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Set new password' })).not.toBeInTheDocument();
    });

    it('submits the new password with the user id and token from the route_params', async () => {
        withRouteParams({ user_id: '123', token: 'tok-abc' });
        vi.mocked(AuthApi.resetPassword).mockResolvedValue({ status: 200, message: 'OK' });

        renderWithProviders(
            <ResetPasswordStyle style={{} as unknown as ResetPasswordField} styleProps={{}} cssClass="section-1" />,
        );

        fireEvent.change(screen.getByLabelText(/^New password/i), { target: { value: 'NewSecret123' } });
        fireEvent.change(screen.getByLabelText(/Confirm new password/i), { target: { value: 'NewSecret123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Set new password' }));

        await waitFor(() => expect(AuthApi.resetPassword).toHaveBeenCalledWith(123, 'tok-abc', 'NewSecret123'));
    });

    it('rejects mismatched passwords without calling the API', async () => {
        withRouteParams({ user_id: '123', token: 'tok-abc' });

        renderWithProviders(
            <ResetPasswordStyle style={{} as unknown as ResetPasswordField} styleProps={{}} cssClass="section-1" />,
        );

        fireEvent.change(screen.getByLabelText(/^New password/i), { target: { value: 'NewSecret123' } });
        fireEvent.change(screen.getByLabelText(/Confirm new password/i), { target: { value: 'Mismatch123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Set new password' }));

        expect(await screen.findByText('The two passwords do not match.')).toBeInTheDocument();
        expect(AuthApi.resetPassword).not.toHaveBeenCalled();
    });

    it('renders the CMS-managed reset-mode labels and messages when provided', async () => {
        withRouteParams({ user_id: '123', token: 'tok-abc' });

        renderWithProviders(
            <ResetPasswordStyle
                style={{
                    reset_title: { content: 'Choose your new password' },
                    reset_label_pw: { content: 'Password' },
                    reset_pw_placeholder: { content: 'Minimum 8 characters' },
                    reset_label_pw_confirm: { content: 'Repeat password' },
                    reset_pw_confirm_placeholder: { content: 'Repeat it here' },
                    reset_label_submit: { content: 'Save password' },
                    reset_error_pw_mismatch: { content: 'Passwords must match exactly.' },
                } as unknown as ResetPasswordField}
                styleProps={{}}
                cssClass="section-1"
            />,
        );

        expect(screen.getByText('Choose your new password')).toBeInTheDocument();
        expect(screen.getByLabelText(/^Password/)).toHaveAttribute('placeholder', 'Minimum 8 characters');
        expect(screen.getByLabelText(/^Repeat password/)).toHaveAttribute('placeholder', 'Repeat it here');

        fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'NewSecret123' } });
        fireEvent.change(screen.getByLabelText(/^Repeat password/), { target: { value: 'Mismatch123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save password' }));

        expect(await screen.findByText('Passwords must match exactly.')).toBeInTheDocument();
    });

    describe('post-reset redirect', () => {
        // Regression: the countdown pushed /login unconditionally and was created
        // inside the submit handler with no cleanup. Opening a reset link while
        // signed in therefore landed a sign-in page on top of a live session, and
        // navigating away mid-countdown still fired a stray push.
        beforeEach(() => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
            withRouteParams({ user_id: '123', token: 'tok-abc' });
            vi.mocked(AuthApi.resetPassword).mockResolvedValue({ status: 200, message: 'OK' });
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        async function submitNewPassword() {
            fireEvent.change(screen.getByLabelText(/^New password/i), { target: { value: 'NewSecret123' } });
            fireEvent.change(screen.getByLabelText(/Confirm new password/i), { target: { value: 'NewSecret123' } });
            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: 'Set new password' }));
            });
        }

        it('sends an anonymous visitor to the login page after the countdown', async () => {
            renderWithProviders(
                <ResetPasswordStyle style={{} as unknown as ResetPasswordField} styleProps={{}} cssClass="section-1" />,
            );

            await submitNewPassword();
            await act(async () => { vi.advanceTimersByTime(3000); });

            expect(pushMock).toHaveBeenCalledWith('/login');
        });

        it('keeps an already signed-in visitor on their session and sends them home instead', async () => {
            authState.value = { isAuthenticated: true, isLoading: false };

            renderWithProviders(
                <ResetPasswordStyle style={{} as unknown as ResetPasswordField} styleProps={{}} cssClass="section-1" />,
            );

            await submitNewPassword();
            await act(async () => { vi.advanceTimersByTime(3000); });

            expect(pushMock).toHaveBeenCalledWith('/home');
            expect(pushMock).not.toHaveBeenCalledWith('/login');
        });

        it('cancels the pending redirect when the page unmounts mid-countdown', async () => {
            const { unmount } = renderWithProviders(
                <ResetPasswordStyle style={{} as unknown as ResetPasswordField} styleProps={{}} cssClass="section-1" />,
            );

            await submitNewPassword();
            await act(async () => { vi.advanceTimersByTime(1000); });
            unmount();
            await act(async () => { vi.advanceTimersByTime(5000); });

            expect(pushMock).not.toHaveBeenCalled();
        });
    });

    describe('session-aware back link', () => {
        it('offers "Back to sign in" to an anonymous visitor', () => {
            renderWithProviders(
                <ResetPasswordStyle style={{} as unknown as ResetPasswordField} styleProps={{}} cssClass="section-1" />,
            );

            expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/login');
        });

        it('offers the way home instead of a sign-in link when a session is already active', () => {
            authState.value = { isAuthenticated: true, isLoading: false };

            renderWithProviders(
                <ResetPasswordStyle style={{} as unknown as ResetPasswordField} styleProps={{}} cssClass="section-1" />,
            );

            expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/home');
            expect(screen.queryByRole('link', { name: 'Back to sign in' })).not.toBeInTheDocument();
        });
    });

    it('renders the CMS-managed request-mode labels when provided', () => {
        // These were hardcoded English while set-password mode was localisable.
        renderWithProviders(
            <ResetPasswordStyle
                style={{
                    request_title: { content: 'Passwort zurücksetzen' },
                    request_subtitle: { content: 'Wir senden Ihnen einen Link.' },
                    request_label_email: { content: 'E-Mail-Adresse' },
                    label_back_to_login: { content: 'Zurück zur Anmeldung' },
                } as unknown as ResetPasswordField}
                styleProps={{}}
                cssClass="section-1"
            />,
        );

        expect(screen.getByText('Passwort zurücksetzen')).toBeInTheDocument();
        expect(screen.getByText('Wir senden Ihnen einen Link.')).toBeInTheDocument();
        expect(screen.getByLabelText(/E-Mail-Adresse/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Zurück zur Anmeldung' })).toBeInTheDocument();
    });
});
