/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type { IAdminNavigationMenuItem, IAdminNavigationOverview } from '../api/admin/navigation.api';
import {
    CREATE_PAGE_MENU_KEYS,
    type ICreatePageFormValues,
    type ICreatePageNavigationPrefill,
    type TCreatePageMenuKey,
} from '../types/forms/create-page.types';
import type { IAdminPage } from '../types/responses/admin/admin.types';

/** Matches backend `AdminPageService::GROUP_ADMIN` — always granted full access. */
export const SYSTEM_ADMIN_GROUP_NAME = 'admin';

export function isSystemAdminGroup(group: { name: string }): boolean {
    return group.name.trim().toLowerCase() === SYSTEM_ADMIN_GROUP_NAME;
}

export function buildPageLookup(pages: IAdminPage[]): Map<number, IAdminPage> {
    const map = new Map<number, IAdminPage>();
    for (const page of pages) {
        map.set(page.id_pages, page);
    }
    return map;
}

export function formatMenuItemLabel(
    item: IAdminNavigationMenuItem,
    pageById: Map<number, IAdminPage>,
): string {
    if (item.item_type === 'page' && item.page_id) {
        const page = pageById.get(item.page_id);
        if (page) {
            return page.url ? `${page.keyword} (${page.url})` : page.keyword;
        }
    }
    if (item.item_type === 'external_url' && item.external_url) {
        return `External link: ${item.external_url}`;
    }
    if (item.item_type === 'group') {
        return `Menu group #${item.id}`;
    }
    return `${item.item_type} #${item.id}`;
}

export function getMenuSiblingsAtParent(
    items: IAdminNavigationMenuItem[],
    parentItemId: number | null,
): IAdminNavigationMenuItem[] {
    return items
        .filter((item) => (item.parent_item_id ?? null) === parentItemId)
        .sort((a, b) => a.position - b.position);
}

export type TMenuInsertPositionMode = 'start' | 'end' | `after:${number}`;

export function buildMenuInsertPositionOptions(
    siblings: IAdminNavigationMenuItem[],
    pageById: Map<number, IAdminPage>,
): Array<{ value: TMenuInsertPositionMode; label: string }> {
    const options: Array<{ value: TMenuInsertPositionMode; label: string }> = [
        { value: 'start', label: 'At the start (first)' },
    ];

    for (const sibling of siblings) {
        options.push({
            value: `after:${sibling.id}`,
            label: `After ${formatMenuItemLabel(sibling, pageById)}`,
        });
    }

    options.push({ value: 'end', label: 'At the end (last)' });
    return options;
}

/**
 * Maps a wizard position choice to the numeric `position` sent on create.
 * `undefined` lets the backend append at the end.
 */
export function resolveMenuInsertPosition(
    mode: TMenuInsertPositionMode | undefined,
    siblings: IAdminNavigationMenuItem[],
): number | undefined {
    if (!mode || mode === 'end') {
        return undefined;
    }

    if (mode === 'start') {
        const first = siblings[0];
        return first ? Math.max(1, first.position - 5) : 10;
    }

    if (mode.startsWith('after:')) {
        const itemId = Number(mode.slice('after:'.length));
        const index = siblings.findIndex((row) => row.id === itemId);
        if (index === -1) {
            return undefined;
        }
        const current = siblings[index];
        const next = siblings[index + 1];
        if (!next) {
            return current.position + 5;
        }
        return Math.floor((current.position + next.position) / 2);
    }

    return undefined;
}

export type TChildPageMenuMode = 'auto_include' | 'under_parent';

export interface IChildPageMenuContext {
    menuKey: TCreatePageMenuKey;
    mode: TChildPageMenuMode;
    /** The parent page's menu item — the child is nested here, never at root. */
    parentItemId: number;
}

/**
 * Menus where a child page may appear: only under the parent's existing menu
 * entry (or auto-included when the parent uses page_children).
 */
export function resolveChildPageMenuContexts(
    parentPage: IAdminPage,
    navigationOverview: IAdminNavigationOverview | undefined,
): IChildPageMenuContext[] {
    if (!navigationOverview?.menus) {
        return [];
    }

    const contexts: IChildPageMenuContext[] = [];
    const parentPageId = parentPage.id_pages;

    for (const menuKey of CREATE_PAGE_MENU_KEYS) {
        const items = navigationOverview.menus[menuKey]?.items ?? [];
        const parentItems = items.filter((item) => item.page_id === parentPageId);
        if (parentItems.length === 0) {
            continue;
        }

        const autoParent = parentItems.find((item) => item.child_source === 'page_children');
        if (autoParent) {
            contexts.push({
                menuKey,
                mode: 'auto_include',
                parentItemId: autoParent.id,
            });
            continue;
        }

        contexts.push({
            menuKey,
            mode: 'under_parent',
            parentItemId: parentItems[0].id,
        });
    }

    return contexts;
}

export function buildInitialNavigationMenusState(
    parentPage: IAdminPage | null | undefined,
    navigationPrefill: ICreatePageNavigationPrefill | undefined,
    navigationOverview: IAdminNavigationOverview | undefined,
): Pick<ICreatePageFormValues, 'navigationMenus' | 'navigationMenuOptions'> {
    const navigationMenus: TCreatePageMenuKey[] = [];
    const navigationMenuOptions: ICreatePageFormValues['navigationMenuOptions'] = {};

    if (navigationPrefill) {
        const { menuKey, parentItemId } = navigationPrefill;
        navigationMenus.push(menuKey);
        navigationMenuOptions[menuKey] = {
            parentItemId: parentItemId ?? null,
        };
    }

    if (parentPage?.navigationMembership?.length && navigationOverview) {
        const childPageMenuContexts = resolveChildPageMenuContexts(parentPage, navigationOverview);
        const parentAutoIncludeMenus = childPageMenuContexts
            .filter((context) => context.mode === 'auto_include')
            .map((context) => context.menuKey);
        const wizardMenuKeys = parentPage.id_pages
            ? childPageMenuContexts.map((context) => context.menuKey)
            : [...CREATE_PAGE_MENU_KEYS];

        for (const membership of parentPage.navigationMembership) {
            if (!membership.explicit || !membership.menu_item_id) {
                continue;
            }
            const menuKey = membership.menu_key as TCreatePageMenuKey;
            if (!wizardMenuKeys.includes(menuKey) || parentAutoIncludeMenus.includes(menuKey)) {
                continue;
            }
            if (!navigationMenus.includes(menuKey)) {
                navigationMenus.push(menuKey);
            }
            navigationMenuOptions[menuKey] = {
                ...(navigationMenuOptions[menuKey] ?? {}),
                parentItemId: membership.menu_item_id,
                insertPosition: navigationMenuOptions[menuKey]?.insertPosition ?? 'end',
                childSource: navigationMenuOptions[menuKey]?.childSource ?? 'manual',
            };
        }
    }

    return { navigationMenus, navigationMenuOptions };
}

export function resolveInitialMenuTab(
    navigationPrefill: ICreatePageNavigationPrefill | undefined,
    parentPage: IAdminPage | null | undefined,
    navigationOverview: IAdminNavigationOverview | undefined,
): TCreatePageMenuKey {
    if (navigationPrefill?.menuKey) {
        return navigationPrefill.menuKey;
    }
    if (parentPage?.id_pages && navigationOverview) {
        const contexts = resolveChildPageMenuContexts(parentPage, navigationOverview);
        if (contexts[0]) {
            return contexts[0].menuKey;
        }
    }
    return CREATE_PAGE_MENU_KEYS[0];
}

export function buildChildPageParentMenuLabel(
    parentPage: IAdminPage,
    parentItemId: number,
    navigationOverview: IAdminNavigationOverview | undefined,
    pageById: Map<number, IAdminPage>,
): string {
    const items = navigationOverview?.menus
        ? CREATE_PAGE_MENU_KEYS.flatMap((menuKey) => navigationOverview.menus[menuKey]?.items ?? [])
        : [];
    const parentItem = items.find((item) => item.id === parentItemId);
    const pageLabel = parentPage.url
        ? `${parentPage.keyword} (${parentPage.url})`
        : parentPage.keyword;
    if (parentItem) {
        return `Under ${formatMenuItemLabel(parentItem, pageById)}`;
    }
    return `Under ${pageLabel}`;
}
