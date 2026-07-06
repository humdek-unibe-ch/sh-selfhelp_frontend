/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
    WEB_HEADER_PRESET_VALUES,
    type INavigationMenu,
    type INavigationMenuItem,
    type TWebHeaderPreset,
} from '@selfhelp/shared';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { WebsiteHeaderRenderer } from '../WebsiteHeaderRenderer';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
    useSearchParams: () => ({ get: () => null }),
    usePathname: () => '/',
}));

vi.mock('../../../../../../hooks/useAuth', () => ({
    useAuth: () => ({ isLoading: false, user: null }),
}));

vi.mock('../../../../../../hooks/useIsClient', () => ({
    useIsClient: () => true,
}));

vi.mock('../../../shared', () => ({
    InternalLink: ({ href, children }: { href?: string | null; children: React.ReactNode }) => (
        <a href={href ?? '#'}>{children}</a>
    ),
}));

vi.mock('../../../shared/common', () => ({
    IconComponent: () => null,
}));

function item(label: string, id: number, layer: 'top' | null = null): INavigationMenuItem {
    return {
        id,
        item_type: 'page',
        label,
        description: null,
        aria_label: null,
        icon: null,
        mobile_icon: null,
        position: id,
        layer,
        external_url: null,
        page: { id: 100 + id, keyword: label.toLowerCase(), url: `/${label.toLowerCase()}`, title: label },
        is_active: true,
        children_nav: null,
        children: [],
    };
}

function menuWithPreset(preset: TWebHeaderPreset): INavigationMenu {
    return {
        key: 'web_header',
        platform: 'web',
        surface: 'header',
        preset,
        max_depth: null,
        item_limit: null,
        children_nav: 'sidebar',
        show_breadcrumbs: false,
        items: [item('About', 1), item('Contact', 2)],
    };
}

describe('WebsiteHeaderRenderer', () => {
    it.each(WEB_HEADER_PRESET_VALUES)('renders without crashing for preset %s', (preset) => {
        renderWithProviders(
            <WebsiteHeaderRenderer menu={menuWithPreset(preset)} />,
        );

        expect(screen.getByRole('link', { name: /About/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Contact/i })).toBeInTheDocument();
    });

    it('renders nothing when the menu has no items', () => {
        renderWithProviders(
            <WebsiteHeaderRenderer menu={{ ...menuWithPreset('dropdown'), items: [] }} />,
        );

        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('renders tabs list for tabs preset', () => {
        renderWithProviders(
            <WebsiteHeaderRenderer menu={menuWithPreset('tabs')} />,
        );

        expect(screen.getByRole('tab', { name: /About/i })).toBeInTheDocument();
    });

    it('renders tabpanel content for mega-menu preset', () => {
        const nested = menuWithPreset('mega-menu');
        nested.items = [{
            ...item('Services', 1),
            children: [item('Consulting', 2)],
        }];
        renderWithProviders(
            <WebsiteHeaderRenderer menu={nested} />,
        );

        expect(screen.getByRole('link', { name: /Services/i })).toBeInTheDocument();
    });

    it('switches structural output when preset changes', () => {
        const { rerender } = renderWithProviders(
            <WebsiteHeaderRenderer menu={menuWithPreset('simple')} />,
        );
        expect(screen.queryByRole('tab')).not.toBeInTheDocument();

        rerender(<WebsiteHeaderRenderer menu={menuWithPreset('tabs')} />);
        expect(screen.getByRole('tab', { name: /About/i })).toBeInTheDocument();
    });

    it.each(['double-dropdown', 'double-mega-menu'] as const)(
        'renders double-row chrome for %s preset',
        (preset) => {
            renderWithProviders(
                <WebsiteHeaderRenderer
                    menu={menuWithPreset(preset)}
                    utilitySlot={<span data-testid="utility-slot">Utility</span>}
                />,
            );
            expect(screen.getByTestId('utility-slot')).toBeInTheDocument();
            expect(screen.getAllByRole('link', { name: /About/i }).length).toBeGreaterThan(0);
        },
    );

    it('respects max_depth by not rendering nested dropdown children beyond the limit', () => {
        const nested = menuWithPreset('dropdown');
        nested.max_depth = 1;
        nested.items = [{
            ...item('Services', 1),
            children: [item('Consulting', 2)],
        }];
        renderWithProviders(<WebsiteHeaderRenderer menu={nested} />);
        expect(screen.getByRole('link', { name: /Services/i })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Consulting/i })).not.toBeInTheDocument();
    });

    it('covers every supported web header preset without crashing', () => {
        for (const preset of WEB_HEADER_PRESET_VALUES) {
            const { unmount } = renderWithProviders(
                <WebsiteHeaderRenderer menu={menuWithPreset(preset)} />,
            );
            expect(screen.getByRole('link', { name: /About/i })).toBeInTheDocument();
            unmount();
        }
    });

    it('splits top-layer items into the secondary row for double presets', () => {
        const menu = menuWithPreset('double-dropdown');
        menu.items = [item('About', 1), item('Support', 2, 'top')];

        renderWithProviders(<WebsiteHeaderRenderer menu={menu} />);

        const topNav = screen.getByRole('navigation', { name: /Secondary navigation/i });
        const mainNav = screen.getByRole('navigation', { name: /Main navigation/i });
        expect(topNav).toContainElement(screen.getByRole('link', { name: /Support/i }));
        expect(mainNav).toContainElement(screen.getByRole('link', { name: /About/i }));
    });

    it('merges top-layer items into the single row for single presets', () => {
        const menu = menuWithPreset('dropdown');
        menu.items = [item('Support', 1, 'top'), item('About', 2)];

        renderWithProviders(<WebsiteHeaderRenderer menu={menu} />);

        expect(screen.queryByRole('navigation', { name: /Secondary navigation/i })).not.toBeInTheDocument();
        const mainNav = screen.getByRole('navigation', { name: /Main navigation/i });
        const links = screen.getAllByRole('link');
        expect(mainNav).toContainElement(screen.getByRole('link', { name: /Support/i }));
        // Main-layer items render first, top-layer items are appended.
        expect(links.map((link) => link.textContent)).toEqual(['About', 'Support']);
    });
});
