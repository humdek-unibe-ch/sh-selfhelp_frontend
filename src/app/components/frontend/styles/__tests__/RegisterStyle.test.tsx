/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * Higher-risk subject: the public self-registration form. The mutation, router
 * and page context are mocked so the test pins the contract the BFF relies on
 * (validation_code is posted to /api/auth/register), the success state, and
 * that a backend validation error (invalid / already-used code) is surfaced
 * verbatim to the user instead of a raw "Request failed" message.
 */
const { mutateMock, registerState, pushMock, replaceMock } = vi.hoisted(() => {
    const mutateMock = vi.fn();
    return {
        mutateMock,
        registerState: {
            value: {
                mutate: mutateMock as (vars: unknown) => void,
                isPending: false,
                isError: false,
                isSuccess: false,
                error: null as unknown,
            },
        },
        pushMock: vi.fn(),
        replaceMock: vi.fn(),
    };
});

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock, replace: replaceMock, prefetch: vi.fn() }),
}));
vi.mock('../../../contexts/PageContext', () => ({
    usePageContext: () => ({ pageId: 42 }),
}));
vi.mock('../../../../../hooks/mutations/useRegisterMutation', () => ({
    useRegisterMutation: () => registerState.value,
}));
vi.mock('../../../../../hooks/useAuth', () => ({
    useAuth: () => ({ isAuthenticated: false, isLoading: false }),
}));

import RegisterStyle from '../RegisterStyle';

type RegisterStyleProps = ComponentProps<typeof RegisterStyle>;
type RegisterStyleField = RegisterStyleProps['style'];

function makeStyle(overrides: Record<string, unknown> = {}): RegisterStyleField {
    return {
        id: 1,
        style_name: 'register',
        title: { content: 'Register' },
        label_user: { content: 'Email' },
        label_submit: { content: 'Register' },
        alert_success: { content: 'Success! Please check your email.' },
        alert_fail: { content: 'Registration failed.' },
        fields: { open_registration: { content: '0' } },
        ...overrides,
    } as unknown as RegisterStyleField;
}

function setRegisterState(partial: Partial<typeof registerState.value>): void {
    registerState.value = {
        mutate: mutateMock as (vars: unknown) => void,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        ...partial,
    };
}

describe('RegisterStyle', () => {
    beforeEach(() => {
        mutateMock.mockClear();
        pushMock.mockClear();
        replaceMock.mockClear();
        setRegisterState({});
    });

    it('posts the email and validation code to the register mutation', async () => {
        const user = userEvent.setup();
        renderWithProviders(<RegisterStyle style={makeStyle()} styleProps={{}} cssClass="section-1" />);

        // Mantine appends a required-asterisk inside the <label>, so match the
        // accessible name by substring rather than exact text.
        await user.type(screen.getByLabelText(/Email/i), 'qa.guest@selfhelp.test');
        await user.type(screen.getByLabelText(/Validation Code/i), 'ABCD1234');
        await user.click(screen.getByRole('button', { name: 'Register' }));

        expect(mutateMock).toHaveBeenCalledTimes(1);
        expect(mutateMock).toHaveBeenCalledWith({
            page_id: 42,
            email: 'qa.guest@selfhelp.test',
            code: 'ABCD1234',
        });
    });

    it('shows the success alert after a successful registration', () => {
        setRegisterState({ isSuccess: true });
        renderWithProviders(<RegisterStyle style={makeStyle()} styleProps={{}} cssClass="section-1" />);

        expect(screen.getByText('Success! Please check your email.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Go to Login' })).toBeInTheDocument();
    });

    it('surfaces the backend error message for an already-used code', () => {
        setRegisterState({
            isError: true,
            error: { response: { status: 422, data: { error: 'This registration code has already been used.' } } },
        });
        renderWithProviders(<RegisterStyle style={makeStyle()} styleProps={{}} cssClass="section-1" />);

        expect(screen.getByText('This registration code has already been used.')).toBeInTheDocument();
    });
});
