/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

export const MENU_TABS = [
    { key: 'web_header', label: 'Web header' },
    { key: 'web_footer', label: 'Web footer' },
    { key: 'mobile_drawer', label: 'Mobile drawer' },
    { key: 'mobile_bottom_tabs', label: 'Mobile tabs' },
] as const;

export type TMenuKey = (typeof MENU_TABS)[number]['key'];

export type TNavigationTab = TMenuKey | 'settings' | 'export_import';

export const NAVIGATION_TAB_VALUES: readonly TNavigationTab[] = [
    ...MENU_TABS.map((tab) => tab.key),
    'settings',
    'export_import',
];

export function isNavigationTab(value: string | null | undefined): value is TNavigationTab {
    return value != null && (NAVIGATION_TAB_VALUES as readonly string[]).includes(value);
}

export function navigationTabFromSearchParam(value: string | null): TNavigationTab {
    return isNavigationTab(value) ? value : 'web_header';
}

export function isMobileMenuKey(menuKey: TMenuKey): boolean {
    return menuKey === 'mobile_drawer' || menuKey === 'mobile_bottom_tabs';
}

export function menuPlatformForKey(menuKey: TMenuKey): 'web' | 'mobile' {
    return isMobileMenuKey(menuKey) ? 'mobile' : 'web';
}
