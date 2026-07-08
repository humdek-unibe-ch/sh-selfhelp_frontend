/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { type IResourceItem } from '@refinedev/core';
import { NavigationApi } from '../api/navigation.api';
import {
    type IPageItem,
    type INavigationMenu,
    type INavigationPayload,
} from '../shared';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useLanguageContext } from '../app/components/contexts/LanguageContext';
import { useAuthUser } from './useUserData';
import {
    selectProfilePages,
    transformNavigationPages,
} from '../utils/navigation.utils';
import { keepPlaceholderWithinAuthScope, navigationAuthScopeFromUserId } from '../utils/navigation-query.utils';

interface INavigationData {
    pages: IPageItem[];
    navigation: INavigationPayload | null;
    headerMenu: INavigationMenu | null;
    footerMenu: INavigationMenu | null;
    profilePages: IPageItem[];
    routes: IPageItem[];
    resources?: IResourceItem[];
}

function flattenPages(pages: IPageItem[]): IPageItem[] {
    let result: IPageItem[] = [];
    for (const page of pages) {
        result.push({ ...page, children: [] });
        if (page.children && page.children.length > 0) {
            result = result.concat(flattenPages(page.children));
        }
    }
    return result;
}

/**
 * Unified hook for fetching pages + navigation payload for public UI.
 */
export function useAppNavigation(options: { isAdmin?: boolean } = {}) {
    const { isAdmin = false } = options;
    const { currentLanguageId } = useLanguageContext();
    const { user, isLoading: isAuthLoading } = useAuthUser();
    // Navigation visibility is permission-filtered. Keep guest and logged-in
    // caches isolated so a fresh login never reuses a "guest-empty" menu for
    // 10 minutes due staleTime.
    const authScope = navigationAuthScopeFromUserId(user?.id);

    const navigationEnabled = currentLanguageId > 0 && !isAuthLoading;

    const pagesQuery = useQuery({
        queryKey: [...REACT_QUERY_CONFIG.QUERY_KEYS.FRONTEND_PAGES(currentLanguageId), authScope],
        queryFn: () => NavigationApi.getPagesWithLanguage(currentLanguageId),
        enabled: navigationEnabled,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.FRONTEND_PAGES.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.FRONTEND_PAGES.gcTime,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1,
        placeholderData: keepPlaceholderWithinAuthScope(authScope),
    });

    const navigationQuery = useQuery({
        queryKey: [...REACT_QUERY_CONFIG.QUERY_KEYS.NAVIGATION(currentLanguageId), authScope],
        queryFn: () => NavigationApi.getNavigation(currentLanguageId),
        enabled: navigationEnabled,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.FRONTEND_PAGES.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.FRONTEND_PAGES.gcTime,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1,
        placeholderData: keepPlaceholderWithinAuthScope(authScope),
    });

    const rawPages = pagesQuery.data ?? [];
    const fixedPages = transformNavigationPages(rawPages);
    const navigation = navigationQuery.data ?? null;
    const headerMenu = navigation?.menus?.web_header ?? null;
    const footerMenu = navigation?.menus?.web_footer ?? null;
    const profilePages = selectProfilePages(fixedPages);
    const routes = flattenPages(fixedPages);

    const resources: IResourceItem[] = useMemo(() => {
        if (!isAdmin) {
            return [];
        }
        return fixedPages.map((page) => ({
            name: page.keyword,
            list: `/admin/pages/${page.keyword}`,
            show: `/admin/pages/${page.keyword}`,
            edit: `/admin/pages/${page.keyword}/edit`,
            create: `/admin/pages/create`,
            meta: {
                label: page.title || page.keyword,
                parent: page.parent_page_id
                    ? fixedPages.find((p) => p.id_pages === page.parent_page_id)?.keyword
                    : undefined,
                canDelete: true,
                params: page.url?.includes('[') ? { nav: { type: 'number' } } : {},
                protocol: ['web'],
            },
        }));
    }, [fixedPages, isAdmin]);

    const data: INavigationData = useMemo(() => ({
        pages: fixedPages,
        navigation,
        headerMenu,
        footerMenu,
        profilePages,
        routes,
        resources,
    }), [fixedPages, navigation, headerMenu, footerMenu, profilePages, routes, resources]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as unknown as Record<string, unknown>).__NAVIGATION_DATA__ = data;
        }
    }, [data]);

    const isLoading = pagesQuery.isLoading || navigationQuery.isLoading;
    const isFetching = pagesQuery.isFetching || navigationQuery.isFetching;
    const error = pagesQuery.error ?? navigationQuery.error;

    return {
        pages: data.pages,
        navigation: data.navigation,
        headerMenu: data.headerMenu,
        footerMenu: data.footerMenu,
        profilePages: data.profilePages,
        routes: data.routes,
        resources: data.resources ?? [],
        isLoading,
        error,
        isFetching,
    };
}
