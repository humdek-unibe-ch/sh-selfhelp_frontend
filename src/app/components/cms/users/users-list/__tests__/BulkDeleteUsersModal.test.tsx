/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { BulkDeleteUsersModal } from '../BulkDeleteUsersModal';
import type { IUserBasic } from '../../../../../../types/responses/admin/users.types';

const makeUser = (id: number): IUserBasic => ({
    id,
    email: `user${id}@selfhelp.test`,
    name: `User ${id}`,
    user_name: `user${id}`,
    last_login: null,
    status: 'active',
    blocked: false,
    receives_notifications: false,
    receives_emails: false,
    code: null,
    validation_code: null,
    groups: '',
    roles: '',
    user_activity: 0,
    user_type_code: 'user',
    user_type: 'User',
});

function setup(userCount: number) {
    const onConfirm = vi.fn();
    renderWithProviders(
        <BulkDeleteUsersModal
            opened
            onClose={vi.fn()}
            users={Array.from({ length: userCount }, (_, i) => makeUser(i + 1))}
            onConfirm={onConfirm}
            isLoading={false}
        />,
    );
    return { onConfirm };
}

describe('BulkDeleteUsersModal', () => {
    it('names the users so the admin can see what they are destroying', () => {
        setup(2);
        expect(screen.getByText('user1@selfhelp.test')).toBeInTheDocument();
        expect(screen.getByText('user2@selfhelp.test')).toBeInTheDocument();
    });

    it('warns that the deletion cannot be undone', () => {
        setup(2);
        expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
    });

    it('truncates a long selection instead of an unreadable wall of emails', () => {
        setup(12);
        expect(screen.getByText('user8@selfhelp.test')).toBeInTheDocument();
        expect(screen.queryByText('user9@selfhelp.test')).not.toBeInTheDocument();
        expect(screen.getByText(/and 4 more/)).toBeInTheDocument();
    });

    it('deletes only once the admin confirms', async () => {
        const user = userEvent.setup();
        const { onConfirm } = setup(2);
        expect(onConfirm).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: 'Delete 2 users' }));
        expect(onConfirm).toHaveBeenCalledOnce();
    });
});
