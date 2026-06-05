/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * The reset-password section renders two screens from the one style: the
 * "request a link" form at /reset, and the "set a new password" form at
 * /reset/{id}/{token} (the link in the recovery email). These tests pin that
 * the URL drives the mode and that each form calls the right Auth API.
 */
const { useParamsMock } = vi.hoisted(() => ({ useParamsMock: vi.fn() }));

vi.mock('next/navigation', () => ({
    useParams: () => useParamsMock(),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('../../../../../api/auth.api', () => ({
    AuthApi: { requestPasswordReset: vi.fn(), resetPassword: vi.fn() },
}));

import ResetPasswordStyle from '../ResetPasswordStyle';
import { AuthApi } from '../../../../../api/auth.api';

type ResetPasswordField = ComponentProps<typeof ResetPasswordStyle>['style'];

describe('ResetPasswordStyle', () => {
    beforeEach(() => {
        useParamsMock.mockReset();
        vi.mocked(AuthApi.requestPasswordReset).mockReset();
        vi.mocked(AuthApi.resetPassword).mockReset();
    });

    it('requests a reset link from the email form on /reset', async () => {
        useParamsMock.mockReturnValue({ slug: ['reset'] });
        vi.mocked(AuthApi.requestPasswordReset).mockResolvedValue({ status: 200, message: 'OK' });

        renderWithProviders(
            <ResetPasswordStyle style={{} as unknown as ResetPasswordField} styleProps={{}} cssClass="section-1" />,
        );

        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'qa@example.test' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

        await waitFor(() => expect(AuthApi.requestPasswordReset).toHaveBeenCalledWith('qa@example.test'));
    });

    it('shows the set-new-password form when a user id and token are in the URL', () => {
        useParamsMock.mockReturnValue({ slug: ['reset', '123', 'tok-abc'] });

        renderWithProviders(
            <ResetPasswordStyle style={{} as unknown as ResetPasswordField} styleProps={{}} cssClass="section-1" />,
        );

        expect(screen.getByLabelText(/^New password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirm new password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Set new password' })).toBeInTheDocument();
    });

    it('submits the new password with the user id and token from the URL', async () => {
        useParamsMock.mockReturnValue({ slug: ['reset', '123', 'tok-abc'] });
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
        useParamsMock.mockReturnValue({ slug: ['reset', '123', 'tok-abc'] });

        renderWithProviders(
            <ResetPasswordStyle style={{} as unknown as ResetPasswordField} styleProps={{}} cssClass="section-1" />,
        );

        fireEvent.change(screen.getByLabelText(/^New password/i), { target: { value: 'NewSecret123' } });
        fireEvent.change(screen.getByLabelText(/Confirm new password/i), { target: { value: 'Mismatch123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Set new password' }));

        expect(await screen.findByText('The two passwords do not match.')).toBeInTheDocument();
        expect(AuthApi.resetPassword).not.toHaveBeenCalled();
    });
});
