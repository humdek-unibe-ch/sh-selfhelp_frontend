/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import { ThemeToggle } from '../ThemeToggle';

/**
 * L12: the control opens a Light/Dark/Auto menu but was labelled
 * "Toggle color scheme". Its name must describe the menu and current choice.
 */
describe('ThemeToggle', () => {
    it('names the menu button after the current color scheme', async () => {
        renderWithProviders(<ThemeToggle />);

        const button = screen.getByRole('button', { name: /^Color scheme: / });
        expect(button).toHaveAttribute('aria-haspopup', 'menu');

        await userEvent.click(button);
        await userEvent.click(await screen.findByRole('menuitem', { name: 'Dark' }));

        expect(screen.getByRole('button', { name: 'Color scheme: Dark' })).toBeInTheDocument();
    });
});
