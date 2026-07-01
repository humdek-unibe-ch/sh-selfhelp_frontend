/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import {
    WEB_HEADER_PRESET_VALUES,
    searchMenuPagesInPayload,
    type INavigationMenuItem,
    type INavigationPayload,
} from '@selfhelp/shared';

function menuItem(partial: Partial<INavigationMenuItem>): INavigationMenuItem {
    return {
        id: 1,
        item_type: 'page',
        label: 'Home',
        position: 0,
        children: [],
        ...partial,
    };
}

function navigationPayload(headerItems: INavigationMenuItem[]): INavigationPayload {
    return {
        menus: {
            web_header: { key: 'web_header', platform: 'web', surface: 'header', preset: 'dropdown', items: headerItems },
            web_footer: { key: 'web_footer', platform: 'web', surface: 'footer', items: [] },
            mobile_drawer: { key: 'mobile_drawer', platform: 'mobile', surface: 'drawer', items: [] },
            mobile_bottom_tabs: { key: 'mobile_bottom_tabs', platform: 'mobile', surface: 'bottom_tabs', items: [] },
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
        search: { mode: 'menu_pages', min_chars: 2, result_limit: 8, default_visibility: 'all_accessible_pages', field_policy: 'all_display_text' },
    };
}

describe('header presets contract', () => {
    it('lists all six Mantine-inspired web header presets', () => {
        expect(WEB_HEADER_PRESET_VALUES).toEqual([
            'simple',
            'dropdown',
            'mega-menu',
            'tabs',
            'double-dropdown',
            'double-mega-menu',
        ]);
    });
});

describe('menu_pages header search', () => {
    it('filters only pages present in the resolved web header menu tree', () => {
        const payload = navigationPayload([
            menuItem({
                id: 1,
                page: { id: 10, keyword: 'about', url: '/about', title: 'About us' },
            }),
            menuItem({
                id: 2,
                page: { id: 11, keyword: 'contact', url: '/contact', title: 'Contact' },
            }),
        ]);

        const hits = searchMenuPagesInPayload(payload, 'about');
        expect(hits).toHaveLength(1);
        expect(hits[0]?.keyword).toBe('about');
    });

    it('respects min_chars before returning menu-page hits', () => {
        const payload = navigationPayload([
            menuItem({
                id: 1,
                page: { id: 10, keyword: 'about', url: '/about', title: 'About us' },
            }),
        ]);
        payload.search.min_chars = 4;

        expect(searchMenuPagesInPayload(payload, 'abo')).toHaveLength(0);
        expect(searchMenuPagesInPayload(payload, 'about')).toHaveLength(1);
    });
});
