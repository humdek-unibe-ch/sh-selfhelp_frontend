/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
 */
/**
 * Custom hook for managing admin pages data.
 * Provides functionality to fetch and transform admin pages data from the API
 * into a structured format suitable for navigation and management interfaces.
 *
 * @module hooks/useAdminPages
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { type IAdminPage } from '../types/responses/admin/admin.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useAuth } from './useAuth';
import { parseCrudPermissions, type ICrudPermissions } from '../utils/permissions.utils';
import { AdminApi } from '../api/admin';
import { pageHasMenuMembership } from '../utils/admin-navigation-membership';

export interface ISystemPageLink {
    label: string;
    link: string;
    keyword: string;
    id: number;
    title: string;
    children?: ISystemPageLink[];
}

export interface IPageHierarchy {
    id: number;
    id_pages: number;
    keyword: string;
    label: string;
    link: string;
    url: string;
    id_parent_page: number | null;
    id_page_types: number;
    hasChildren: boolean;
    children: IPageHierarchy[];
    level: number;
    navigationMembership: IAdminPage['navigationMembership'];
    is_system: boolean;
    is_headless: boolean;
    is_open_access: boolean;
    id_page_access_types: number;
    crud: number;
    permissions: ICrudPermissions;
}

export interface ICategorizedPages {
    menu: IPageHierarchy[];
    footer: IPageHierarchy[];
    other: IPageHierarchy[];
}

export interface ICategorizedSystemPages {
    authentication: ISystemPageLink[];
    profile: ISystemPageLink[];
    errors: ISystemPageLink[];
    legal: ISystemPageLink[];
    other: ISystemPageLink[];
}

export interface IConfigurationPageLink {
    label: string;
    link: string;
    keyword: string;
    id: number;
    title: string;
}

function isInWebHeader(page: IPageHierarchy): boolean {
    return pageHasMenuMembership(page.navigationMembership, 'web_header');
}

function isInWebFooter(page: IPageHierarchy): boolean {
    return pageHasMenuMembership(page.navigationMembership, 'web_footer');
}

/**
 * Hook for fetching admin pages with hierarchical structure
 * @returns Object containing various categorized page data
 */
export function useAdminPages() {
    const { isAuthenticated, user } = useAuth();

    const isActuallyAuthenticated = !!isAuthenticated && !!user;

    const { data, isLoading, error, isFetching } = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES,
        queryFn: async () => {
            return await AdminApi.getAdminPages();
        },
        enabled: isActuallyAuthenticated,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.ADMIN_PAGES.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.ADMIN_PAGES.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        placeholderData: keepPreviousData,
        select: (data: IAdminPage[]) => {
            if (!data || !Array.isArray(data)) {
                return {
                    allPages: [],
                    systemPages: [],
                    regularPages: [],
                    configurationPages: [],
                    systemPageLinks: [],
                    configurationPageLinks: [],
                    categorizedSystemPages: {
                        authentication: [],
                        profile: [],
                        errors: [],
                        legal: [],
                        other: [],
                    },
                    hierarchicalPages: [],
                    categorizedRegularPages: {
                        menu: [],
                        footer: [],
                        other: [],
                    },
                };
            }

            const configurationPages = data.filter((page) => page.id_page_types && page.id_page_types > 3);
            const regularPages = data.filter((page) => !page.id_page_types || page.id_page_types <= 3);
            const systemPages = data.filter((page) => page.is_system && (!page.id_page_types || page.id_page_types <= 3));

            const getAdminLabel = (page: IAdminPage): string => page.keyword;

            const systemPageLinks: ISystemPageLink[] = [];

            const configurationPageLinks: IConfigurationPageLink[] = configurationPages
                .sort((a, b) => a.keyword.localeCompare(b.keyword))
                .map((page) => ({
                    label: page.keyword,
                    link: `/admin/pages/${page.keyword}`,
                    keyword: page.keyword,
                    id: page.id_pages,
                    title: page.keyword,
                }));

            const currentSystemPages = data.filter((page) => page.is_system);
            const categorizedSystemPages = {
                authentication: currentSystemPages
                    .filter((page) => page.keyword?.toLowerCase().includes('auth') || page.keyword?.toLowerCase().includes('login'))
                    .map((page) => ({
                        label: page.keyword,
                        link: `/admin/pages/${page.keyword}`,
                        keyword: page.keyword,
                        id: page.id_pages,
                        title: page.keyword,
                    })),
                profile: currentSystemPages
                    .filter((page) => page.keyword?.toLowerCase().includes('profile'))
                    .map((page) => ({
                        label: page.keyword,
                        link: `/admin/pages/${page.keyword}`,
                        keyword: page.keyword,
                        id: page.id_pages,
                        title: page.keyword,
                    })),
                errors: currentSystemPages
                    .filter((page) => page.keyword?.toLowerCase().includes('error') || page.keyword?.toLowerCase().includes('404'))
                    .map((page) => ({
                        label: page.keyword,
                        link: `/admin/pages/${page.keyword}`,
                        keyword: page.keyword,
                        id: page.id_pages,
                        title: page.keyword,
                    })),
                legal: currentSystemPages
                    .filter((page) =>
                        page.keyword?.toLowerCase().includes('privacy')
                        || page.keyword?.toLowerCase().includes('terms')
                        || page.keyword?.toLowerCase().includes('legal'),
                    )
                    .map((page) => ({
                        label: page.keyword,
                        link: `/admin/pages/${page.keyword}`,
                        keyword: page.keyword,
                        id: page.id_pages,
                        title: page.keyword,
                    })),
                other: currentSystemPages
                    .filter(
                        (page) =>
                            !page.keyword?.toLowerCase().includes('auth')
                            && !page.keyword?.toLowerCase().includes('login')
                            && !page.keyword?.toLowerCase().includes('profile')
                            && !page.keyword?.toLowerCase().includes('error')
                            && !page.keyword?.toLowerCase().includes('404')
                            && !page.keyword?.toLowerCase().includes('privacy')
                            && !page.keyword?.toLowerCase().includes('terms')
                            && !page.keyword?.toLowerCase().includes('legal'),
                    )
                    .map((page) => ({
                        label: page.keyword,
                        link: `/admin/pages/${page.keyword}`,
                        keyword: page.keyword,
                        id: page.id_pages,
                        title: page.keyword,
                    })),
            };

            const buildHierarchy = (pages: IAdminPage[], parentId: number | null = null, level = 0): IPageHierarchy[] => {
                const children = pages.filter((page) => page.id_parent_page === parentId);

                return children
                    .map((page) => {
                        const permissions = parseCrudPermissions(page.crud);
                        const childPages = buildHierarchy(pages, page.id_pages, level + 1);
                        const sortedChildren = [...childPages].sort((a, b) => a.keyword.localeCompare(b.keyword));

                        return {
                            id: page.id_pages,
                            id_pages: page.id_pages,
                            keyword: page.keyword,
                            label: getAdminLabel(page),
                            link: `/admin/pages/${page.keyword}`,
                            url: page.url,
                            id_parent_page: page.id_parent_page,
                            id_page_types: page.id_page_types,
                            hasChildren: sortedChildren.length > 0,
                            children: sortedChildren,
                            level,
                            navigationMembership: page.navigationMembership ?? [],
                            is_system: page.is_system,
                            is_headless: page.is_headless,
                            is_open_access: page.is_open_access,
                            id_page_access_types: page.id_page_access_types,
                            crud: page.crud,
                            permissions,
                        };
                    })
                    .sort((a, b) => a.keyword.localeCompare(b.keyword));
            };

            const hierarchicalPages = buildHierarchy(regularPages);

            const menuPages = hierarchicalPages.filter((page) => isInWebHeader(page) && !page.is_system);
            const footerPages = hierarchicalPages.filter((page) => isInWebFooter(page));
            const otherRegularPages = hierarchicalPages.filter(
                (page) => !isInWebHeader(page) && !isInWebFooter(page),
            );

            const categorizedRegularPages: ICategorizedPages = {
                menu: menuPages.sort((a, b) => a.keyword.localeCompare(b.keyword)),
                footer: footerPages.sort((a, b) => a.keyword.localeCompare(b.keyword)),
                other: otherRegularPages.sort((a, b) => a.label.localeCompare(b.label)),
            };

            return {
                allPages: data,
                systemPages,
                regularPages,
                configurationPages,
                systemPageLinks,
                configurationPageLinks,
                categorizedSystemPages,
                hierarchicalPages,
                categorizedRegularPages,
            };
        },
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: true,
    });

    return {
        pages: data?.allPages || [],
        systemPages: data?.systemPages || [],
        regularPages: data?.regularPages || [],
        configurationPages: data?.configurationPages || [],
        systemPageLinks: data?.systemPageLinks || [],
        configurationPageLinks: data?.configurationPageLinks || [],
        categorizedSystemPages: data?.categorizedSystemPages || {
            authentication: [] as ISystemPageLink[],
            profile: [] as ISystemPageLink[],
            errors: [] as ISystemPageLink[],
            legal: [] as ISystemPageLink[],
            other: [] as ISystemPageLink[],
        },
        hierarchicalPages: data?.hierarchicalPages || [],
        categorizedRegularPages: data?.categorizedRegularPages || {
            menu: [],
            footer: [],
            other: [],
        },
        isLoading,
        isFetching,
        error,
    };
}
