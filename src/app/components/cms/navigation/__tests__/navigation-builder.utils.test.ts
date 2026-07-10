/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';

import type { IAdminNavigationMenuItem } from '../../../../../api/admin/navigation.api';
import type { IAdminPage } from '../../../../../types/responses/admin/admin.types';

import {
    isNavigationTab,
    isMobileMenuKey,
    menuPlatformForKey,
    navigationTabFromSearchParam,
} from '../navigation-builder.constants';
import {
    buildChildDropPayload,
    buildSiblingReorderPayload,
    buildSiblingStepPayload,
    formatPageRoutePath,
    getDirectCmsChildPages,
    getMenuItemDisplay,
    getPageEditorPath,
    getPageKeyword,
    menuIconForItem,
    nestStoredMenuItems,
} from '../navigation-builder.utils';

function makeItem(overrides: Partial<IAdminNavigationMenuItem> & { id: number }): IAdminNavigationMenuItem {
    return {
        parent_item_id: null,
        item_type: 'page',
        page_id: null,
        external_url: null,
        icon: null,
        mobile_icon: null,
        label: null,
        position: 10,
        layer: null,
        is_active: true,
        ...overrides,
    };
}

describe('navigation-builder.constants', () => {
    it('accepts menu keys and settings as tabs', () => {
        expect(isNavigationTab('web_header')).toBe(true);
        expect(isNavigationTab('settings')).toBe(true);
        expect(isNavigationTab('unknown')).toBe(false);
    });

    it('falls back to web_header for invalid menu params', () => {
        expect(navigationTabFromSearchParam(null)).toBe('web_header');
        expect(navigationTabFromSearchParam('settings')).toBe('settings');
        expect(navigationTabFromSearchParam('not-a-menu')).toBe('web_header');
    });

    it('detects mobile menu keys', () => {
        expect(isMobileMenuKey('mobile_drawer')).toBe(true);
        expect(isMobileMenuKey('mobile_bottom_tabs')).toBe(true);
        expect(isMobileMenuKey('web_header')).toBe(false);
        expect(menuPlatformForKey('web_footer')).toBe('web');
        expect(menuPlatformForKey('mobile_drawer')).toBe('mobile');
    });
});

describe('navigation-builder.utils', () => {
    const pages: IAdminPage[] = [
        {
            id_pages: 1,
            keyword: 'parent',
            url: 'parent',
            id_parent_page: null,
            is_headless: false,
            is_open_access: false,
            id_page_access_types: 1,
            id_page_types: 1,
            is_system: false,
            crud: 15,
        },
        {
            id_pages: 2,
            keyword: 'home',
            url: 'home',
            id_parent_page: 1,
            is_headless: false,
            is_open_access: false,
            id_page_access_types: 1,
            id_page_types: 1,
            is_system: false,
            crud: 15,
        },
    ];

    const pageById = new Map(pages.map((page) => [page.id_pages, page]));
    const resolvedLabels = new Map<number, string>([[9, 'Projekt Name']]);

    it('uses resolved labels for group headings', () => {
        const item = makeItem({ id: 9, item_type: 'group' });
        expect(getMenuItemDisplay(item, pageById, resolvedLabels).primary).toBe('Projekt Name');
    });

    it('shows page keywords instead of raw ids', () => {
        const item = makeItem({ id: 1, page_id: 2 });

        expect(getMenuItemDisplay(item, pageById, resolvedLabels)).toEqual({
            primary: 'home',
            secondary: '/home',
        });
        expect(getPageKeyword(pageById, 2)).toBe('home');
        expect(getPageKeyword(pageById, 99)).toBe('Page #99');
        expect(getPageEditorPath(pageById, 2)).toBe('/admin/pages/home');
        expect(getPageEditorPath(pageById, null)).toBeNull();

        const iconItem = makeItem({ id: 1, page_id: 2, position: 0, icon: 'home', mobile_icon: 'House' });
        expect(menuIconForItem(iconItem, 'web_header')).toBe('home');
        expect(menuIconForItem(iconItem, 'mobile_drawer')).toBe('House');
    });

    it('lists direct CMS child pages in stable order', () => {
        expect(getDirectCmsChildPages(pages, 1).map((page) => page.id_pages)).toEqual([2]);
        expect(getDirectCmsChildPages(pages, 2)).toEqual([]);
    });

    it('builds sibling reorder payloads for top and bottom drops', () => {
        const items: IAdminNavigationMenuItem[] = [
            makeItem({ id: 1, page_id: 2, position: 10 }),
            makeItem({ id: 2, page_id: 3, position: 20 }),
        ];

        const movedBelow = buildSiblingReorderPayload(items, 1, 2, 'bottom');
        expect(movedBelow.map((row) => row.item_id)).toEqual([2, 1]);

        const movedAbove = buildSiblingReorderPayload(items, 2, 1, 'top');
        expect(movedAbove.map((row) => row.item_id)).toEqual([2, 1]);
    });

    it('builds sibling step payloads for up and down moves', () => {
        const items: IAdminNavigationMenuItem[] = [
            makeItem({ id: 1, page_id: 2, position: 10 }),
            makeItem({ id: 2, page_id: 3, position: 20 }),
        ];

        expect(buildSiblingStepPayload(items, 1, 'up')).toEqual([]);
        expect(buildSiblingStepPayload(items, 2, 'down')).toEqual([]);
        expect(buildSiblingStepPayload(items, 2, 'up').map((row) => row.item_id)).toEqual([2, 1]);
        expect(buildSiblingStepPayload(items, 1, 'down').map((row) => row.item_id)).toEqual([2, 1]);
    });

    it('keeps step moves within the same header layer when sameLayerOnly is set', () => {
        const items: IAdminNavigationMenuItem[] = [
            makeItem({ id: 1, page_id: 2, position: 10, layer: 'top' }),
            makeItem({ id: 2, page_id: 3, position: 20 }),
            makeItem({ id: 3, page_id: 4, position: 30 }),
        ];

        // Item 2 is the first item of the main layer: no upward move possible.
        expect(buildSiblingStepPayload(items, 2, 'up', true)).toEqual([]);
        // Within the main layer items 2 and 3 swap normally.
        expect(buildSiblingStepPayload(items, 3, 'up', true).map((row) => row.item_id)).toEqual([3, 2]);
        // Without the layer filter, item 2 can step above the top-layer item.
        expect(buildSiblingStepPayload(items, 2, 'up', false).map((row) => row.item_id)).toEqual([2, 1, 3]);
    });

    it('formats page routes without double slashes', () => {
        expect(formatPageRoutePath('/test')).toBe('/test');
        expect(formatPageRoutePath('test')).toBe('/test');
        expect(formatPageRoutePath('//test')).toBe('//test');
    });

    it('renders orphaned items at the root when their parent is missing', () => {
        const items: IAdminNavigationMenuItem[] = [
            makeItem({ id: 1, page_id: 2, position: 10 }),
            makeItem({ id: 2, parent_item_id: 99, page_id: 3, position: 20 }),
        ];

        const nested = nestStoredMenuItems(items);
        expect(nested.map((row) => row.id)).toEqual([1, 2]);
        expect(nested[1]?.orphaned).toBe(true);
    });

    it('builds child drop payloads when nesting under a parent item', () => {
        const items: IAdminNavigationMenuItem[] = [
            makeItem({ id: 1, page_id: 10, position: 10 }),
            makeItem({ id: 2, page_id: 20, position: 20 }),
        ];

        const payload = buildChildDropPayload(items, 2, 1);
        expect(payload.find((row) => row.item_id === 2)).toEqual({
            item_id: 2,
            position: 10,
            parent_item_id: 1,
        });
    });
});
