/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
 */
import { useQuery } from '@tanstack/react-query';
import { AdminNavigationApi } from '../api/admin/navigation.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useAuth } from './useAuth';

interface IResolvedMenuItem {
    id: number;
    label?: string;
    page?: { id: number; keyword: string } | null;
    children?: IResolvedMenuItem[];
}

export interface IAdminPreviewNavLink {
    label: string;
    link: string;
    links?: IAdminPreviewNavLink[];
    id?: number | string;
    menuBuilderLink?: string;
}

function transformResolvedItems(items: IResolvedMenuItem[], menuKey: string): IAdminPreviewNavLink[] {
    return items.map((item) => {
        const keyword = item.page?.keyword ?? item.label ?? String(item.id);
        const menuItemId = typeof item.id === 'number' ? item.id : null;
        return {
            label: keyword,
            link: item.page ? `/admin/pages/${item.page.keyword}` : '#',
            id: item.page?.id ?? item.id,
            menuBuilderLink: menuItemId !== null
                ? `/admin/navigation?menu=${encodeURIComponent(menuKey)}&item=${menuItemId}`
                : undefined,
            links: item.children?.length ? transformResolvedItems(item.children, menuKey) : undefined,
        };
    });
}

export function useAdminNavigationPreview(menuKey: string, languageId = 1) {
    const { isAuthenticated, user } = useAuth();
    const enabled = !!isAuthenticated && !!user;

    return useQuery({
        queryKey: ['admin-navigation-preview', menuKey, languageId],
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
