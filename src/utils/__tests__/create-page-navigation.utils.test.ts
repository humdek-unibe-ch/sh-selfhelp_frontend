/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { IAdminNavigationMenuItem } from '../../api/admin/navigation.api';
import type { IAdminPage } from '../../types/responses/admin/admin.types';
import {
    buildInitialNavigationMenusState,
    buildMenuInsertPositionOptions,
    formatMenuItemLabel,
    isSystemAdminGroup,
    resolveChildPageMenuContexts,
    resolveInitialMenuTab,
    resolveMenuInsertPosition,
} from '../create-page-navigation.utils';

function page(partial: Partial<IAdminPage>): IAdminPage {
    return {
        id_pages: 1,
        keyword: 'home',
        url: '/',
        id_parent_page: null,
        is_headless: false,
        is_system: false,
        is_open_access: false,
        id_page_types: 1,
        id_page_access_types: 1,
        crud: 0,
        ...partial,
    };
}

function menuItem(partial: Partial<IAdminNavigationMenuItem>): IAdminNavigationMenuItem {
    return {
        id: 1,
        parent_item_id: null,
        item_type: 'page',
        page_id: 1,
        external_url: null,
        icon_override: null,
        position: 10,
        child_source: 'manual',
        auto_include_depth: null,
        is_active: true,
        excluded_page_ids: [],
        ...partial,
    };
}

describe('isSystemAdminGroup', () => {
    it('matches the seeded admin group name case-insensitively', () => {
        expect(isSystemAdminGroup({ name: 'admin' })).toBe(true);
        expect(isSystemAdminGroup({ name: 'Admin' })).toBe(true);
        expect(isSystemAdminGroup({ name: 'therapist' })).toBe(false);
    });
});

describe('formatMenuItemLabel', () => {
    const pageById = new Map<number, IAdminPage>([
        [8, page({ id_pages: 8, keyword: 'team', url: '/team' })],
    ]);

    it('shows keyword and url for page menu items', () => {
        expect(formatMenuItemLabel(menuItem({ page_id: 8 }), pageById)).toBe('team (/team)');
    });

    it('falls back when the page is unknown', () => {
        expect(formatMenuItemLabel(menuItem({ page_id: 99, item_type: 'page' }), pageById)).toBe('page #1');
    });
});

describe('resolveMenuInsertPosition', () => {
    const siblings = [
        menuItem({ id: 1, position: 10 }),
        menuItem({ id: 2, position: 20 }),
        menuItem({ id: 3, position: 30 }),
    ];

    it('omits position for end placement', () => {
        expect(resolveMenuInsertPosition('end', siblings)).toBeUndefined();
    });

    it('inserts before the first sibling', () => {
        expect(resolveMenuInsertPosition('start', siblings)).toBe(5);
    });

    it('inserts between siblings', () => {
        expect(resolveMenuInsertPosition('after:1', siblings)).toBe(15);
    });

    it('inserts after the last sibling', () => {
        expect(resolveMenuInsertPosition('after:3', siblings)).toBe(35);
    });
});

describe('resolveChildPageMenuContexts', () => {
    const parent = page({ id_pages: 10, keyword: 'tessss', url: '/tessss' });

    it('returns auto_include when parent menu item uses page_children', () => {
        const overview = {
            menus: {
                web_header: {
                    menu_key: 'web_header',
                    platform: 'web',
                    surface: 'public',
                    items: [
                        menuItem({ id: 8, page_id: 10, child_source: 'page_children' }),
                    ],
                },
            },
            settings: {},
        };
        expect(resolveChildPageMenuContexts(parent, overview)).toEqual([
            { menuKey: 'web_header', mode: 'auto_include', parentItemId: 8 },
        ]);
    });

    it('returns under_parent for explicit parent menu items', () => {
        const overview = {
            menus: {
                web_header: {
                    menu_key: 'web_header',
                    platform: 'web',
                    surface: 'public',
                    items: [
                        menuItem({ id: 9, page_id: 10, child_source: 'manual' }),
                    ],
                },
            },
            settings: {},
        };
        expect(resolveChildPageMenuContexts(parent, overview)).toEqual([
            { menuKey: 'web_header', mode: 'under_parent', parentItemId: 9 },
        ]);
    });
});

describe('buildMenuInsertPositionOptions', () => {
    it('lists start, after-each, and end choices with readable labels', () => {
        const pageById = new Map<number, IAdminPage>([
            [8, page({ id_pages: 8, keyword: 'about', url: '/about' })],
        ]);
        const options = buildMenuInsertPositionOptions(
            [menuItem({ id: 8, page_id: 8, position: 10 })],
            pageById,
        );
        expect(options.map((row) => row.value)).toEqual(['start', 'after:8', 'end']);
        expect(options[1]?.label).toContain('about (/about)');
    });
});

describe('buildInitialNavigationMenusState', () => {
    it('applies navigation prefill on open', () => {
        expect(buildInitialNavigationMenusState(null, { menuKey: 'web_footer', parentItemId: 4 }, undefined))
            .toEqual({
                navigationMenus: ['web_footer'],
                navigationMenuOptions: { web_footer: { parentItemId: 4 } },
            });
    });

    it('merges explicit parent navigation membership when overview is available', () => {
        const parent = page({
            id_pages: 10,
            navigationMembership: [{
                menu_key: 'web_header',
                menu_item_id: 9,
                explicit: true,
            }],
        });
        const overview = {
            menus: {
                web_header: {
                    menu_key: 'web_header',
                    platform: 'web',
                    surface: 'public',
                    items: [menuItem({ id: 9, page_id: 10 })],
                },
            },
            settings: {},
        };

        expect(buildInitialNavigationMenusState(parent, undefined, overview)).toEqual({
            navigationMenus: ['web_header'],
            navigationMenuOptions: {
                web_header: {
                    parentItemId: 9,
                    insertPosition: 'end',
                    childSource: 'manual',
                },
            },
        });
    });
});

describe('resolveInitialMenuTab', () => {
    it('prefers navigation prefill over child-page defaults', () => {
        expect(resolveInitialMenuTab({ menuKey: 'mobile_drawer' }, page({ id_pages: 10 }), undefined))
            .toBe('mobile_drawer');
    });

    it('uses the first child-page menu context when creating under a parent', () => {
        const parent = page({ id_pages: 10 });
        const overview = {
            menus: {
                web_header: {
                    menu_key: 'web_header',
                    platform: 'web',
                    surface: 'public',
                    items: [menuItem({ id: 9, page_id: 10 })],
                },
            },
            settings: {},
        };
        expect(resolveInitialMenuTab(undefined, parent, overview)).toBe('web_header');
    });
});
