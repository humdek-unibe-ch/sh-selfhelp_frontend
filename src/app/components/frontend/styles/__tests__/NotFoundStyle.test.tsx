/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * NotFoundStyle is the global 404 surface. It must show a "page not found"
 * message and a route home, plus an auth-aware "Sign in" call to action and
 * configurable title/message content fields.
 */
import NotFoundStyle from '../NotFoundStyle';

describe('NotFoundStyle', () => {
    it('renders the default not-found message, a home link, and a sign-in link for guests', () => {
        renderWithProviders(<NotFoundStyle style={{}} styleProps={{}} cssClass="" isAuthenticated={false} />);
        expect(screen.getByText('Page not found')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Back to home/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Sign in/i })).toBeInTheDocument();
    });

    it('hides the sign-in link for authenticated users', () => {
        renderWithProviders(<NotFoundStyle style={{}} styleProps={{}} cssClass="" isAuthenticated />);
        expect(screen.queryByRole('link', { name: /Sign in/i })).not.toBeInTheDocument();
    });

    it('renders a custom title and message from style content fields', () => {
        renderWithProviders(
            <NotFoundStyle
                style={{ title: { content: 'Gone' }, message: { content: 'Nothing here.' } }}
                styleProps={{}}
                cssClass=""
            />
        );
        expect(screen.getByText('Gone')).toBeInTheDocument();
        expect(screen.getByText('Nothing here.')).toBeInTheDocument();
    });
});
