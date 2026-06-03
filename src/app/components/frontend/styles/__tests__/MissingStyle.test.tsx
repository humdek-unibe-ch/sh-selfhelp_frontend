/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * MissingStyle is the not-found surface for unknown CMS routes. It must show a
 * clear "page not found" message and a route back to the home page.
 */
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

import MissingStyle from '../MissingStyle';

describe('MissingStyle', () => {
    it('renders the page-not-found message and a home button', () => {
        renderWithProviders(<MissingStyle />);
        expect(screen.getByText('Page not found')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Back to home/i })).toBeInTheDocument();
    });
});
