/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression: the header must mount exactly ONE search field.
 *
 * `visibleFrom` / `hiddenFrom` hide with CSS only — both subtrees stay
 * mounted, so the desktop and mobile slots would otherwise run two live
 * queries at once. The sibling specs mock `HeaderSearch` away, so this uses
 * the real component.
 */
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { INavigationMenu, INavigationPayload } from '@selfhelp/shared';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { WebsiteHeaderLayout } from '../WebsiteHeaderLayout';

const mockGet = vi.fn().mockResolvedValue({
    data: { status: 200, message: 'OK', error: null, logged_in: true, meta: {}, data: { results: [] } },
});

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

const navigationPayload = {
    menus: {},
    search: { mode: 'content_index', min_chars: 1, result_limit: 8 },
} as unknown as INavigationPayload;

vi.mock('../../../../../../hooks/useAppNavigation', () => ({
    useAppNavigation: () => ({
        headerMenu: null,
        navigation: navigationPayload,
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
    InternalLink: ({ href, children }: { href?: string | null; children: React.ReactNode }) => (
        <a href={href ?? '#'}>{children}</a>
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

vi.mock('../../../../../../api/base.api', () => ({
    permissionAwareApiClient: { get: (...args: unknown[]) => mockGet(...args) },
}));

// false = desktop viewport (inline field), true = mobile (icon + modal).
const mockIsCompact = vi.hoisted(() => ({ value: false }));

vi.mock('@mantine/hooks', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as Record<string, unknown>),
        useMediaQuery: () => mockIsCompact.value,
    };
});

const simpleMenu = { preset: 'simple', items: [], max_depth: 3 } as unknown as INavigationMenu;

function renderHeader(menu: INavigationMenu) {
    return renderWithProviders(
        <WebsiteHeaderLayout initialHeaderMenu={menu} initialNavigation={navigationPayload} />,
    );
}

describe('WebsiteHeaderLayout search mounting', () => {
    it('mounts exactly one search field on a desktop viewport', () => {
        mockIsCompact.value = false;
        renderHeader(simpleMenu);

        expect(screen.getAllByPlaceholderText('Search')).toHaveLength(1);
    });

    it('mounts exactly one search control on a mobile viewport', () => {
        mockIsCompact.value = true;
        renderHeader(simpleMenu);

        // The compact surface renders the icon trigger, not an inline input.
        expect(screen.queryAllByPlaceholderText('Search')).toHaveLength(0);
        expect(screen.getAllByRole('button', { name: 'Search' })).toHaveLength(1);
    });
});
