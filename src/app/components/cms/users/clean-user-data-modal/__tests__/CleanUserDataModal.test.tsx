/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { CleanUserDataModal } from '../CleanUserDataModal';

const USER_EMAIL = 'qa.user@selfhelp.test';

function setup() {
    const onConfirm = vi.fn();
    renderWithProviders(
        <CleanUserDataModal
            opened
            onClose={vi.fn()}
            onConfirm={onConfirm}
            userEmail={USER_EMAIL}
            isLoading={false}
        />,
    );
    return { onConfirm, confirmButton: screen.getByRole('button', { name: 'Clean user data' }) };
}

describe('CleanUserDataModal', () => {
    it('spells out what is destroyed and that the account survives', () => {
        setup();
        expect(screen.getByText('all activity logs')).toBeInTheDocument();
        expect(screen.getByText('all input data entered by this user')).toBeInTheDocument();
        expect(screen.getByText('all scheduled actions for this user')).toBeInTheDocument();
        expect(screen.getByText(/The user account itself is kept/)).toBeInTheDocument();
        expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
    });

    it('blocks the destructive action until the email is typed exactly', async () => {
        const user = userEvent.setup();
        const { onConfirm, confirmButton } = setup();

        expect(confirmButton).toBeDisabled();

        const input = screen.getByLabelText(/Type the user's email to confirm/);
        await user.type(input, 'qa.user@selfhelp');
        expect(screen.getByText('Email does not match')).toBeInTheDocument();
        expect(confirmButton).toBeDisabled();

        await user.type(input, '.test');
        expect(confirmButton).toBeEnabled();

        await user.click(confirmButton);
        expect(onConfirm).toHaveBeenCalledOnce();
    });
});
