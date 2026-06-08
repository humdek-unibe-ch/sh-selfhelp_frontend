/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * NoAccessStyle is the surface users land on when they lack permission for a
 * page. It must clearly state access is denied and offer a way back home, with
 * support for a custom title/message.
 */
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

import NoAccessStyle from '../NoAccessStyle';

describe('NoAccessStyle', () => {
    it('renders the default access-denied message and a home button', () => {
        renderWithProviders(<NoAccessStyle style={{}} styleProps={{}} cssClass="" />);
        expect(screen.getByText('Access denied')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Back to home/i })).toBeInTheDocument();
    });

    it('renders a custom title and message from style content fields', () => {
        renderWithProviders(
            <NoAccessStyle
                style={{ title: { content: 'Locked out' }, message: { content: 'You cannot view this.' } }}
                styleProps={{}}
                cssClass=""
            />
        );
        expect(screen.getByText('Locked out')).toBeInTheDocument();
        expect(screen.getByText('You cannot view this.')).toBeInTheDocument();
    });
});
