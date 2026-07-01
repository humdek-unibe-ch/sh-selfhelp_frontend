/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { INavigationMenu } from '@selfhelp/shared';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { FooterLinks } from '../FooterLinks';

vi.mock('../../../../../../hooks/usePagePrefetch', () => ({
    usePagePrefetch: () => ({ createHoverPrefetch: () => undefined }),
}));

vi.mock('../../../../shared', () => ({
    InternalLink: ({ href, children }: { href?: string | null; children: React.ReactNode }) => (
        <a href={href ?? '#'}>{children}</a>
    ),
}));

function footerMenuWithGroups(): INavigationMenu {
    return {
        key: 'web_footer',
        platform: 'web',
        surface: 'footer',
        items: [
            {
                id: 1,
                item_type: 'group',
                label: 'Support',
                position: 1,
                children: [
                    {
                        id: 2,
                        item_type: 'page',
                        label: 'Contact',
                        position: 1,
                        page: { id: 10, keyword: 'contact', url: '/contact', title: 'Contact' },
                    },
                    {
                        id: 3,
                        item_type: 'page',
                        label: 'FAQ',
                        position: 2,
                        page: { id: 11, keyword: 'faq', url: '/faq', title: 'FAQ' },
                    },
                ],
            },
            {
                id: 4,
                item_type: 'group',
                label: 'Legal',
                position: 2,
                children: [
                    {
                        id: 5,
                        item_type: 'page',
                        label: 'Privacy',
                        position: 1,
                        page: { id: 12, keyword: 'privacy', url: '/privacy', title: 'Privacy' },
                    },
                ],
            },
            {
                id: 6,
                item_type: 'external_url',
                label: 'LinkedIn',
                position: 3,
                external_url: 'https://example.com/linkedin',
            },
        ],
    };
}

describe('FooterLinks', () => {
    it('renders grouped footer columns with headings and nested links', () => {
        renderWithProviders(<FooterLinks footerMenu={footerMenuWithGroups()} />);

        expect(screen.getByText('Support')).toBeInTheDocument();
        expect(screen.getByText('Legal')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
        expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq');
        expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    });

    it('renders external URL items as outbound anchors', () => {
        renderWithProviders(<FooterLinks footerMenu={footerMenuWithGroups()} />);

        const external = screen.getByRole('link', { name: 'LinkedIn' });
        expect(external).toHaveAttribute('href', 'https://example.com/linkedin');
        expect(external).toHaveAttribute('target', '_blank');
    });

    it('renders inline layout when footer_layout config is inline', () => {
        const menu = footerMenuWithGroups();
        menu.config = { footer_layout: 'inline' };
        renderWithProviders(<FooterLinks footerMenu={menu} />);

        expect(screen.queryByText('Support')).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Privacy' })).toBeInTheDocument();
    });
});
