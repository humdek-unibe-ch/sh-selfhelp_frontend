/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';

/**
 * Double header presets render two rows (104px) instead of one (60px). The
 * top-right admin shortcut must follow that height, otherwise it lands on top
 * of the second nav row and covers the header links.
 */
vi.mock('next/navigation', () => ({
    usePathname: () => '/some-public-page',
}));
vi.mock('../../../../hooks/useAuth', () => ({
    useAuth: () => ({ hasAdminAccess: () => true }),
}));
vi.mock('../../../../hooks/useAppNavigation', () => ({
    useAppNavigation: () => ({
        navigation: null,
        headerMenu: { preset: 'double-dropdown' },
    }),
}));

import { renderWithProviders } from '../../../../test-utils/renderWithProviders';
import { AdminEditCornerButton } from './AdminEditCornerButton';

describe('AdminEditCornerButton with a double header preset', () => {
    it('drops below the taller two-row header instead of overlapping it', () => {
        renderWithProviders(<AdminEditCornerButton />);

        // 104px double-row header, plus the same 16px gap.
        const link = screen.getByRole('link', { name: 'Edit this page in Admin' });
        expect(link).toHaveStyle({ top: '120px' });
    });
});
