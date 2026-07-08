/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import {
    WEB_HEADER_PRESET_VALUES,
    type INavigationMenu,
    type INavigationMenuItem,
    type TWebHeaderPreset,
} from '@selfhelp/shared';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { WebsiteHeaderLayout } from '../WebsiteHeaderLayout';

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

vi.mock('../../../../../../hooks/useAppNavigation', () => ({
    useAppNavigation: () => ({
        headerMenu: null,
        navigation: null,
        routes: [],
        footerMenu: null,
        profilePages: [],
    }),
}));

vi.mock('../../../../contexts/LanguageContext', () => ({
    useLanguageContext: () => ({
        currentLanguageId: 1,
        languages: [{ id: 1, locale: 'en-GB', name: 'English' }],
        setCurrentLanguageId: vi.fn(),
        setLanguages: vi.fn(),
    }),
}));

vi.mock('../../../shared', () => ({
    InternalLink: ({ href, children, ...props }: { href?: string | null; children: React.ReactNode }) => (
        <a href={href ?? '#'} {...props}>{children}</a>
    ),
}));

vi.mock('../../../shared/common', () => ({
    IconComponent: () => null,
    BurgerMenuClient: () => null,
    LanguageSelector: () => <span>Lang</span>,
    ThemeToggle: () => <span>Theme</span>,
}));

vi.mock('../../../shared/auth/AuthButton', () => ({
    AuthButton: () => <span>Auth</span>,
}));

vi.mock('../HeaderSearch', () => ({
    HeaderSearch: () => <input aria-label="Search" />,
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
    const isDouble = preset === 'double-dropdown' || preset === 'double-mega-menu';
    return {
        key: 'web_header',
        platform: 'web',
        surface: 'header',
        preset,
        max_depth: 2,
        item_limit: null,
        children_nav: 'sidebar',
        show_breadcrumbs: false,
        items: [
            item('Home', 1),
            item('About', 2),
            item('Services', 3),
            item('Products', 4),
            item('News', 5),
            item('Resources', 6),
            item('Contact', 7),
            item('Careers', 8, isDouble ? 'top' : null),
            item('University', 9, isDouble ? 'top' : null),
        ],
    };
}

describe('WebsiteHeaderLayout live-preview chrome', () => {
    it.each(WEB_HEADER_PRESET_VALUES)('shows visible main navigation links for preset %s', (preset) => {
        renderWithProviders(
            <div style={{ width: 1280 }}>
                <WebsiteHeaderLayout initialHeaderMenu={menuWithPreset(preset)} />
            </div>,
        );

        const mainNav = screen.getByRole('navigation', { name: /Main navigation/i });
        expect(within(mainNav).getByRole('link', { name: /Home/i })).toBeVisible();
        expect(within(mainNav).getAllByRole('link').length).toBeGreaterThan(0);
    });
});
