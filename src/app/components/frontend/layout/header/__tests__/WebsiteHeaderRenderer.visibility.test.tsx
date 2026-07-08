/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
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

vi.mock('../../../../contexts/LanguageContext', () => ({
    useLanguageContext: () => ({
        currentLanguageId: 1,
        languages: [{ id: 1, locale: 'en-GB', name: 'English' }],
        setCurrentLanguageId: vi.fn(),
        setLanguages: vi.fn(),
    }),
}));

class ResizeObserverMock {
    private readonly callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
    }

    observe(target: Element): void {
        Object.defineProperty(target, 'clientWidth', {
            configurable: true,
            value: 1200,
        });
        this.callback([], this as unknown as ResizeObserver);
    }

    unobserve(): void {}

    disconnect(): void {}
}

beforeAll(() => {
    globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
});

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

function menuWithPreset(preset: TWebHeaderPreset, count = 2): INavigationMenu {
    return {
        key: 'web_header',
        platform: 'web',
        surface: 'header',
        preset,
        max_depth: null,
        item_limit: null,
        children_nav: 'sidebar',
        show_breadcrumbs: false,
        items: Array.from({ length: count }, (_, index) => item(`Page ${index + 1}`, index + 1)),
    };
}

describe('WebsiteHeaderRenderer visual menu visibility', () => {
    it.each(WEB_HEADER_PRESET_VALUES)('renders root links for preset %s', (preset) => {
        renderWithProviders(
            <div style={{ width: 1200 }}>
                <WebsiteHeaderRenderer menu={menuWithPreset(preset, 4)} />
            </div>,
        );

        const mainNav = screen.getByRole('navigation', { name: /Main navigation/i });
        expect(within(mainNav).getByRole('link', { name: /Page 1/i })).toBeVisible();
    });

    it('renders many dropdown items without hiding the whole row', () => {
        renderWithProviders(
            <div style={{ width: 1200 }}>
                <WebsiteHeaderRenderer menu={menuWithPreset('dropdown', 8)} />
            </div>,
        );

        const mainNav = screen.getByRole('navigation', { name: /Main navigation/i });
        const links = within(mainNav).getAllByRole('link');
        expect(links.length).toBeGreaterThan(0);
        expect(links[0]).toBeVisible();
    });
});
