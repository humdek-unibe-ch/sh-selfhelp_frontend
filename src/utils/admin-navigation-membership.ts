/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type { INavigationMembershipBadge } from '../types/responses/admin/admin.types';

export type TAdminMenuKey = 'web_header' | 'web_footer' | 'mobile_drawer' | 'mobile_bottom_tabs';

export function pageHasMenuMembership(
    membership: INavigationMembershipBadge[] | undefined,
    menuKey: TAdminMenuKey,
): boolean {
    return (membership ?? []).some((badge) => badge.menu_key === menuKey);
}

export function collectMenuPageIds(
    membership: INavigationMembershipBadge[] | undefined,
    menuKey: TAdminMenuKey,
): number[] {
    return (membership ?? [])
        .filter((badge) => badge.menu_key === menuKey)
        .map((badge) => badge.menu_item_id);
}

export interface IAdminMenuPreviewLink {
    label: string;
    link: string;
    links?: IAdminMenuPreviewLink[];
    id?: number | string;
    menuBuilderLink?: string;
    selectable?: boolean;
}

/**
 * Menu-builder preview links for an admin sidebar section. When the resolved
 * preview tree is empty, return a single link to the menu builder instead of
 * falling back to page-tree grouping.
 */
export function buildMenuPreviewSectionLinks(
    previewLinks: IAdminMenuPreviewLink[],
    menuKey: TAdminMenuKey,
    emptyLabel = 'Configure in menu builder',
): IAdminMenuPreviewLink[] {
    if (previewLinks.length > 0) {
        return previewLinks;
    }

    return [{
        label: emptyLabel,
        link: `/admin/navigation?menu=${encodeURIComponent(menuKey)}`,
        id: `${menuKey}-configure`,
        selectable: true,
    }];
}
