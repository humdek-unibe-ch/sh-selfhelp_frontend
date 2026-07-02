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

        const item: IAdminNavigationMenuItem = {

            id: 9,

            parent_item_id: null,

            item_type: 'group',

            page_id: null,

            external_url: null,

            icon: null,
            mobile_icon: null,
            label: null,

            position: 10,

            is_active: true,

        };



        expect(getMenuItemDisplay(item, pageById, resolvedLabels).primary).toBe('Projekt Name');

    });



    it('shows page keywords instead of raw ids', () => {

        const item: IAdminNavigationMenuItem = {

            id: 1,

            parent_item_id: null,

            item_type: 'page',

            page_id: 2,

            external_url: null,

            icon: null,
            mobile_icon: null,
            label: null,

            position: 10,

            is_active: true,

        };



        expect(getMenuItemDisplay(item, pageById, resolvedLabels)).toEqual({

            primary: 'home',

            secondary: '/home',

        });

        expect(getPageKeyword(pageById, 2)).toBe('home');

        expect(getPageKeyword(pageById, 99)).toBe('Page #99');

        expect(getPageEditorPath(pageById, 2)).toBe('/admin/pages/home');

        expect(getPageEditorPath(pageById, null)).toBeNull();

        expect(menuIconForItem({
            id: 1,
            item_type: 'page',
            page_id: 2,
            parent_item_id: null,
            position: 0,
            icon: 'home',
            mobile_icon: 'House',
            label: null,
            external_url: null,
            is_active: true,
        }, 'web_header')).toBe('home');

        expect(menuIconForItem({
            id: 1,
            item_type: 'page',
            page_id: 2,
            parent_item_id: null,
            position: 0,
            icon: 'home',
            mobile_icon: 'House',
            label: null,
            external_url: null,
            is_active: true,
        }, 'mobile_drawer')).toBe('House');

    });



    it('lists direct CMS child pages in stable order', () => {

        expect(getDirectCmsChildPages(pages, 1).map((page) => page.id_pages)).toEqual([2]);

        expect(getDirectCmsChildPages(pages, 2)).toEqual([]);

    });



    it('builds sibling reorder payloads for top and bottom drops', () => {

        const items: IAdminNavigationMenuItem[] = [

            {

                id: 1,

                parent_item_id: null,

                item_type: 'page',

                page_id: 2,

                external_url: null,

                icon: null,
            mobile_icon: null,
            label: null,

                position: 10,

                is_active: true,

            },

            {

                id: 2,

                parent_item_id: null,

                item_type: 'page',

                page_id: 3,

                external_url: null,

                icon: null,
            mobile_icon: null,
            label: null,

                position: 20,

                is_active: true,

            },

        ];



        const movedBelow = buildSiblingReorderPayload(items, 1, 2, 'bottom');

        expect(movedBelow.map((row) => row.item_id)).toEqual([2, 1]);



        const movedAbove = buildSiblingReorderPayload(items, 2, 1, 'top');

        expect(movedAbove.map((row) => row.item_id)).toEqual([2, 1]);

    });



    it('builds sibling step payloads for up and down moves', () => {

        const items: IAdminNavigationMenuItem[] = [

            {

                id: 1,

                parent_item_id: null,

                item_type: 'page',

                page_id: 2,

                external_url: null,

                icon: null,
            mobile_icon: null,
            label: null,

                position: 10,

                is_active: true,

            },

            {

                id: 2,

                parent_item_id: null,

                item_type: 'page',

                page_id: 3,

                external_url: null,

                icon: null,
            mobile_icon: null,
            label: null,

                position: 20,

                is_active: true,

            },

        ];



        expect(buildSiblingStepPayload(items, 1, 'up')).toEqual([]);

        expect(buildSiblingStepPayload(items, 2, 'down')).toEqual([]);

        expect(buildSiblingStepPayload(items, 2, 'up').map((row) => row.item_id)).toEqual([2, 1]);

        expect(buildSiblingStepPayload(items, 1, 'down').map((row) => row.item_id)).toEqual([2, 1]);

    });



    it('formats page routes without double slashes', () => {

        expect(formatPageRoutePath('/test')).toBe('/test');

        expect(formatPageRoutePath('test')).toBe('/test');

        expect(formatPageRoutePath('//test')).toBe('//test');

    });

    it('renders orphaned items at the root when their parent is missing', () => {
        const items: IAdminNavigationMenuItem[] = [
            {
                id: 1,
                parent_item_id: null,
                item_type: 'page',
                page_id: 2,
                external_url: null,
                icon: null,
                mobile_icon: null,
                label: null,
                position: 10,
                is_active: true,
            },
            {
                id: 2,
                parent_item_id: 99,
                item_type: 'page',
                page_id: 3,
                external_url: null,
                icon: null,
                mobile_icon: null,
                label: null,
                position: 20,
                is_active: true,
            },
        ];

        const nested = nestStoredMenuItems(items);
        expect(nested.map((row) => row.id)).toEqual([1, 2]);
        expect(nested[1]?.orphaned).toBe(true);
    });

    it('builds child drop payloads when nesting under a parent item', () => {
        const items: IAdminNavigationMenuItem[] = [
            {
                id: 1,
                parent_item_id: null,
                item_type: 'page',
                page_id: 10,
                external_url: null,
                icon: null,
                mobile_icon: null,
                label: null,
                position: 10,
                is_active: true,
            },
            {
                id: 2,
                parent_item_id: null,
                item_type: 'page',
                page_id: 20,
                external_url: null,
                icon: null,
                mobile_icon: null,
                label: null,
                position: 20,
                is_active: true,
            },
        ];

        const payload = buildChildDropPayload(items, 2, 1);
        expect(payload.find((row) => row.item_id === 2)).toEqual({
            item_id: 2,
            position: 10,
            parent_item_id: 1,
        });
    });

});

