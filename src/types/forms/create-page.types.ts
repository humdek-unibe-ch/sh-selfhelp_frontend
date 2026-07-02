/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * TypeScript interfaces for create page form and related types.
 */
import { type IAdminPage } from '../responses/admin/admin.types';

export const CREATE_PAGE_MENU_KEYS = [
    'web_header',
    'web_footer',
    'mobile_drawer',
    'mobile_bottom_tabs',
] as const;

export type TCreatePageMenuKey = (typeof CREATE_PAGE_MENU_KEYS)[number];

export const WEB_CREATE_PAGE_MENU_KEYS = [
    'web_header',
    'web_footer',
] as const;

export const MOBILE_CREATE_PAGE_MENU_KEYS = [
    'mobile_drawer',
    'mobile_bottom_tabs',
] as const;

export type TCreatePageMenuPlatform = 'web' | 'mobile';

export interface ICreatePageFormValues {
    keyword: string;
    navigationMenus: TCreatePageMenuKey[];
    /** Per-menu options when the menu is selected (childSource, parentItemId, etc.). */
    navigationMenuOptions: Partial<Record<TCreatePageMenuKey, {
        childSource?: string;
        parentItemId?: number | null;
        insertPosition?: string;
    }>>;
    headlessPage: boolean;
    pageAccessType: string;
    urlPattern: string;
    openAccess: boolean;
    customUrlEdit: boolean;
    parentPage?: number | null;
    surface: string;
    accessGroups: number[];
    syncUrlWithParent: boolean;
    oldRoutePolicy: 'ask' | 'keep_alias' | 'remove_old_route';
}

export interface ICreatePageNavigationPrefill {
    menuKey: TCreatePageMenuKey;
    parentItemId?: number | null;
}

export interface ICreatePageModalProps {
    opened: boolean;
    onClose: () => void;
    parentPage?: IAdminPage | null;
    navigationPrefill?: ICreatePageNavigationPrefill;
}
