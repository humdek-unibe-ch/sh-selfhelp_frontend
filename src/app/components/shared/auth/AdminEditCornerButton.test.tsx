/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';

/**
 * The admin shortcut is chrome layered over an arbitrary public page, so its
 * affordance matters as much as its target: it must be a real link (so it is
 * announced as one, and supports middle-click / open-in-new-tab) carrying a
 * visible label rather than a bare coloured icon, and it must stay out of the
 * top-left corner already occupied by the debug button.
 */
vi.mock('next/navigation', () => ({
    usePathname: () => '/some-public-page',
}));
vi.mock('../../../../hooks/useAuth', () => ({
    useAuth: () => ({ hasAdminAccess: () => true }),
}));
vi.mock('../../../../hooks/useAppNavigation', () => ({
    // No resolved menus → the component falls back to the last path segment,
    // and to the single-row header height for its top offset.
    useAppNavigation: () => ({ navigation: null, headerMenu: null }),
}));

import { renderWithProviders } from '../../../../test-utils/renderWithProviders';
import { AdminEditCornerButton } from './AdminEditCornerButton';

describe('AdminEditCornerButton', () => {
    it('renders a labelled link into the admin editor of the current page', () => {
        renderWithProviders(<AdminEditCornerButton />);

        const link = screen.getByRole('link', { name: 'Edit this page in Admin' });
        expect(link).toHaveAttribute('href', '/admin/pages/some-public-page');
        // The visible label is what makes the shortcut self-explanatory.
        expect(link).toHaveTextContent('Edit page');
    });

    it('sits in the bottom-right, clear of the site header', () => {
        renderWithProviders(<AdminEditCornerButton />);

        const link = screen.getByRole('link', { name: 'Edit this page in Admin' });
        expect(link).toHaveStyle({ position: 'fixed', bottom: '3vh', right: '16px' });
    });
});
