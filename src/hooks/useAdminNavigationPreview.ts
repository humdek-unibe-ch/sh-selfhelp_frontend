/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
 */
import { useQuery } from '@tanstack/react-query';
import { AdminNavigationApi } from '../api/admin/navigation.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useAuth } from './useAuth';

import { isMobileMenuKey, menuPlatformForKey, type TMenuKey } from '../app/components/cms/navigation/navigation-builder.constants';

interface IResolvedMenuItem {
    id: number;
    label?: string;
    icon?: string | null;
    mobile_icon?: string | null;
    page?: { id: number; keyword: string } | null;
    children?: IResolvedMenuItem[];
}

export interface IAdminPreviewNavLink {
    label: string;
    link: string;
    links?: IAdminPreviewNavLink[];
    id?: number | string;
    menuBuilderLink?: string;
    menuIcon?: string | null;
    menuPlatform?: 'web' | 'mobile';
}

function transformResolvedItems(items: IResolvedMenuItem[], menuKey: string): IAdminPreviewNavLink[] {
    const menuPlatform = menuPlatformForKey(menuKey as TMenuKey);
    return items.map((item) => {
        const keyword = item.page?.keyword ?? item.label ?? String(item.id);
        const menuItemId = typeof item.id === 'number' ? item.id : null;
        const menuIcon = isMobileMenuKey(menuKey as TMenuKey) ? (item.mobile_icon ?? null) : (item.icon ?? null);
        return {
            label: item.label ?? keyword,
            link: item.page ? `/admin/pages/${item.page.keyword}` : '#',
            // Namespaced per menu: page ids repeat across menus (and can equal
            // menu-item ids), which produced duplicate React keys in the navbar.
            id: `${menuKey}:${item.id}`,
            menuBuilderLink: menuItemId !== null
                ? `/admin/navigation?menu=${encodeURIComponent(menuKey)}&item=${menuItemId}`
                : undefined,
            menuIcon,
            menuPlatform,
            links: item.children?.length ? transformResolvedItems(item.children, menuKey) : undefined,
        };
    });
}

export function useAdminNavigationPreview(menuKey: string, languageId = 1) {
    const { isAuthenticated, user } = useAuth();
    const enabled = !!isAuthenticated && !!user;

    return useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_NAVIGATION_PREVIEW(menuKey, languageId),
        queryFn: async () => {
            const preview = await AdminNavigationApi.getMenuPreview(menuKey, languageId);
            const resolved = preview.resolved as { items?: IResolvedMenuItem[] } | null;
            const items = resolved?.items ?? [];
            return transformResolvedItems(items, menuKey);
        },
        enabled,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.ADMIN_PAGES.staleTime,
    });
}
