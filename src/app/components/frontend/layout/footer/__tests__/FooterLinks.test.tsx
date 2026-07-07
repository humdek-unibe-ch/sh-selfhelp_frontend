/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { INavigationMenu, INavigationMenuItem } from '@selfhelp/shared';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { FooterLinks } from '../FooterLinks';

const mockUseMediaQuery = vi.fn(() => false);

vi.mock('@mantine/hooks', () => ({
    useMediaQuery: () => mockUseMediaQuery(),
}));

vi.mock('../../../../../../hooks/usePagePrefetch', () => ({
    usePagePrefetch: () => ({ createHoverPrefetch: () => undefined }),
}));

vi.mock('../../../../shared', () => ({
    InternalLink: ({ href, children, ...rest }: { href?: string | null; children: React.ReactNode } & Record<string, unknown>) => (
        <a href={href ?? '#'} {...rest}>{children}</a>
    ),
}));

function footerItem(overrides: Partial<INavigationMenuItem> & { id: number; label: string }): INavigationMenuItem {
    return {
        item_type: 'page',
        description: null,
        aria_label: null,
        icon: null,
        mobile_icon: null,
        position: overrides.id,
        layer: null,
        external_url: null,
        page: null,
        is_active: true,
        children_nav: null,
        children: [],
        ...overrides,
    };
}

function footerMenu(preset: 'columns' | 'inline'): INavigationMenu {
    return {
        key: 'web_footer',
        platform: 'web',
        surface: 'footer',
        preset,
        max_depth: 2,
        item_limit: null,
        children_nav: null,
        show_breadcrumbs: false,
        items: [
            footerItem({
                id: 1,
                item_type: 'group',
                label: 'Support',
                children: [
                    footerItem({
                        id: 2,
                        label: 'Contact',
                        page: { id: 10, keyword: 'contact', url: '/contact', title: 'Contact' },
                    }),
                    footerItem({
                        id: 3,
                        label: 'FAQ',
                        page: { id: 11, keyword: 'faq', url: '/faq', title: 'FAQ' },
                    }),
                ],
            }),
            footerItem({
                id: 4,
                item_type: 'group',
                label: 'Legal',
                children: [
                    footerItem({
                        id: 5,
                        label: 'Privacy',
                        page: { id: 12, keyword: 'privacy', url: '/privacy', title: 'Privacy' },
                    }),
                ],
            }),
            footerItem({
                id: 6,
                item_type: 'external_url',
                label: 'LinkedIn',
                external_url: 'https://example.com/linkedin',
            }),
        ],
    };
}

describe('FooterLinks', () => {
    beforeEach(() => {
        mockUseMediaQuery.mockReturnValue(false);
    });

    it('renders grouped footer columns with headings and nested links', () => {
        renderWithProviders(<FooterLinks footerMenu={footerMenu('columns')} />);

        expect(screen.getByText('Support')).toBeInTheDocument();
        expect(screen.getByText('Legal')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
        expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq');
        expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    });

    it('renders standalone links in a separate row under the columns', () => {
        renderWithProviders(<FooterLinks footerMenu={footerMenu('columns')} />);

        const external = screen.getByRole('link', { name: 'LinkedIn' });
        expect(external).toHaveAttribute('href', 'https://example.com/linkedin');
        expect(external).toHaveAttribute('target', '_blank');
        expect(external.className).toContain('link');
    });

    it('flattens groups into one link row for the inline preset', () => {
        renderWithProviders(<FooterLinks footerMenu={footerMenu('inline')} />);

        expect(screen.queryByText('Support')).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Privacy' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'LinkedIn' })).toBeInTheDocument();
    });

    it('skips inactive links in both presets', () => {
        const menu = footerMenu('columns');
        const legalGroup = menu.items[1];
        if (legalGroup?.children[0]) {
            legalGroup.children[0].is_active = false;
        }
        renderWithProviders(<FooterLinks footerMenu={menu} />);

        expect(screen.queryByRole('link', { name: 'Privacy' })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
    });

    it('renders aria_label as accessible name and group description text', () => {
        const menu = footerMenu('columns');
        const supportGroup = menu.items[0];
        supportGroup.description = 'How to reach us';
        if (supportGroup.children[0]) {
            supportGroup.children[0].aria_label = 'Contact support team';
        }
        const external = menu.items[2];
        if (external) {
            external.aria_label = 'Company LinkedIn profile (external)';
        }
        renderWithProviders(<FooterLinks footerMenu={menu} />);

        // aria_label overrides the accessible name while the visible text stays the label.
        const contactLink = screen.getByRole('link', { name: 'Contact support team' });
        expect(contactLink).toHaveTextContent('Contact');
        expect(screen.getByRole('link', { name: 'Company LinkedIn profile (external)' }))
            .toHaveAttribute('href', 'https://example.com/linkedin');
        expect(screen.getByText('How to reach us')).toBeInTheDocument();
    });

    it('renders collapsible column groups on mobile viewports', async () => {
        mockUseMediaQuery.mockReturnValue(true);
        const user = userEvent.setup();
        renderWithProviders(<FooterLinks footerMenu={footerMenu('columns')} />);

        const supportToggle = screen.getByRole('button', { name: 'Support' });
        const legalToggle = screen.getByRole('button', { name: 'Legal' });
        expect(supportToggle).toHaveAttribute('aria-expanded', 'false');
        expect(legalToggle).toHaveAttribute('aria-expanded', 'false');

        await user.click(supportToggle);
        expect(supportToggle).toHaveAttribute('aria-expanded', 'true');
        expect(legalToggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('keeps standalone links in a horizontal meta row on mobile viewports', () => {
        mockUseMediaQuery.mockReturnValue(true);
        renderWithProviders(<FooterLinks footerMenu={footerMenu('columns')} />);

        expect(screen.getByRole('link', { name: 'LinkedIn' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Support' })).toBeInTheDocument();
    });
});
