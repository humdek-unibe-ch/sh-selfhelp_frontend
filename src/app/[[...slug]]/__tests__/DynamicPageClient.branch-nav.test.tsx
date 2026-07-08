/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { type INavigationMenuItem, type INavigationPayload } from '@selfhelp/shared';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import DynamicPageClient from '../DynamicPageClient';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('../../../hooks/useAuth', () => ({
    useAuth: () => ({ isAuthenticated: false }),
}));

vi.mock('../../../hooks/useAppNavigation', () => ({
    useAppNavigation: () => ({ navigation: null }),
}));

vi.mock('../../../hooks/usePageContentByPath', () => ({
    usePageContentByPath: () => ({
        content: {
            id: 203,
            keyword: 'resources',
            title: 'Resources',
            sections: [{ id: 1, style_name: 'container', children: [] }],
            is_headless: false,
        },
        isLoading: false,
        isFetching: false,
        isPlaceholderData: false,
    }),
}));

vi.mock('../../../hooks/usePageContentByKeyword', () => ({
    usePageContentByKeyword: () => ({
        content: null,
        isLoading: false,
        isFetching: false,
        isPlaceholderData: false,
    }),
}));

vi.mock('../../../hooks/useSyncDocumentMetadata', () => ({
    useSyncDocumentMetadata: vi.fn(),
}));

vi.mock('../../../hooks/useRecordLastVisitedPage', () => ({
    useRecordLastVisitedPage: vi.fn(),
}));

vi.mock('../../components/contexts/LanguageContext', () => ({
    useLanguageContext: () => ({ currentLanguageId: 1 }),
}));

vi.mock('../../components/contexts/PreviewModeContext', () => ({
    usePreviewMode: () => ({ isPreviewMode: false }),
}));

vi.mock('../../components', () => ({
    PageContentRenderer: () => <div>Page body</div>,
}));

vi.mock('../../components/shared', () => ({
    InternalLink: ({ href, children }: { href: string; children: React.ReactNode }) => (
        <a href={href}>{children}</a>
    ),
}));

function pageItem(
    label: string,
    id: number,
    keyword: string,
    children: INavigationMenuItem[] = [],
): INavigationMenuItem {
    return {
        id,
        item_type: 'page',
        label,
        description: null,
        aria_label: null,
        icon: null,
        mobile_icon: null,
        position: id,
        layer: null,
        external_url: null,
        page: { id, keyword, url: `/${keyword}`, title: label },
        is_active: true,
        children_nav: 'sidebar',
        children,
    };
}

function navigationPayload(headerItems: INavigationMenuItem[]): INavigationPayload {
    return {
        menus: {
            web_header: {
                key: 'web_header',
                platform: 'web',
                surface: 'header',
                preset: 'dropdown',
                max_depth: null,
                item_limit: null,
                children_nav: 'sidebar',
                show_breadcrumbs: true,
                items: headerItems,
            },
            web_footer: {
                key: 'web_footer',
                platform: 'web',
                surface: 'footer',
                preset: 'columns',
                max_depth: 2,
                item_limit: null,
                children_nav: null,
                show_breadcrumbs: false,
                items: [],
            },
            mobile_drawer: {
                key: 'mobile_drawer',
                platform: 'mobile',
                surface: 'drawer',
                preset: null,
                max_depth: null,
                item_limit: null,
                children_nav: null,
                show_breadcrumbs: false,
                items: [],
            },
            mobile_bottom_tabs: {
                key: 'mobile_bottom_tabs',
                platform: 'mobile',
                surface: 'bottom_tabs',
                preset: null,
                max_depth: 2,
                item_limit: 5,
                children_nav: null,
                show_breadcrumbs: false,
                items: [],
            },
        },
        startup: {
            web_guest_start_page: null,
            web_user_start_page: null,
            web_user_start_mode: 'fixed_page',
            mobile_guest_start_page: null,
            mobile_user_start_page: null,
            mobile_user_start_mode: 'fixed_page',
            mobile_start_page_source: 'same_as_web',
        },
        search: {
            mode: 'menu_pages',
            min_chars: 2,
            result_limit: 8,
            default_visibility: 'all_accessible_pages',
            field_policy: 'all_display_text',
        },
    };
}

const initialNavigation = navigationPayload([
    pageItem('Demo', 1, 'demo', [
        pageItem('Resources', 203, 'resources'),
        pageItem('Guides', 204, 'guides'),
    ]),
]);

describe('DynamicPageClient branch navigation SSR fallback', () => {
    it('renders the sidebar from initialNavigation while live navigation is still null', () => {
        renderWithProviders(
            <DynamicPageClient
                keyword="resources"
                initialPageId={203}
                path="/demo/resources"
                initialNavigation={initialNavigation}
            />,
        );

        expect(screen.getAllByRole('link', { name: 'Resources' }).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByRole('link', { name: 'Guides' }).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Page body')).toBeInTheDocument();
    });
});
