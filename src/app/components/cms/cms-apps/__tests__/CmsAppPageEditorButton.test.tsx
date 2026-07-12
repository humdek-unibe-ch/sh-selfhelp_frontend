/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import { CmsAppPageEditorButton } from '../CmsAppPageEditorButton';

vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

describe('CmsAppPageEditorButton', () => {
    it('renders a page-sections editor link when permitted', () => {
        renderWithProviders(
            <CmsAppPageEditorButton pageKeyword="cms-team-members" canOpen />,
        );

        const link = screen.getByRole('link', { name: 'Edit page' });
        expect(link).toHaveAttribute('href', '/admin/pages/cms-team-members');
    });

    it('hides the link without page read permission', () => {
        renderWithProviders(
            <CmsAppPageEditorButton pageKeyword="cms-team-members" canOpen={false} />,
        );

        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('uses the compact label in modal headers', () => {
        renderWithProviders(
            <CmsAppPageEditorButton pageKeyword="cms-team-form" canOpen compact />,
        );

        expect(screen.getByRole('link', { name: 'Page sections' })).toHaveAttribute(
            'href',
            '/admin/pages/cms-team-form',
        );
    });
});
