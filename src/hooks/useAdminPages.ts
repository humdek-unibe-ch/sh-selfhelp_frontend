/**
 * Custom hook for managing admin pages data.
 * Provides functionality to fetch and transform admin pages data from the API
 * into a structured format suitable for navigation and management interfaces.
 * 
 * @module hooks/useAdminPages
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { IAdminPage } from '../types/responses/admin/admin.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useAuth } from './useAuth';
import { getAccessToken } from '../utils/auth.utils';
import { parseCrudPermissions, ICrudPermissions } from '../utils/permissions.utils';
import { AdminApi } from '../api/admin';

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
    id_pages: number; // For compatibility with IAdminPage
    keyword: string;
    label: string;
    link: string;
    url: string; // For compatibility with IAdminPage
    parent: number | null; // For compatibility with IAdminPage
    id_type: number; // For compatibility with IAdminPage
    hasChildren: boolean;
    children: IPageHierarchy[];
    level: number;
    nav_position: number | null;
    footer_position: number | null;
    is_system: number;
    is_headless: number;
    is_open_access: number;
    id_pageAccessTypes: number;
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
    nav_position: number | null;
}

/**
 * Hook for fetching admin pages with hierarchical structure
 * @returns Object containing various categorized page data
 */
export function useAdminPages() {
    const { isAuthenticated, user } = useAuth();
    
    // More robust authentication check: must have Refine auth state, user data, AND access token
    const isActuallyAuthenticated = !!isAuthenticated && !!user && !!getAccessToken();
    
    const { data, isLoading, error, isFetching } = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES,
        queryFn: async () => {
            return await AdminApi.getAdminPages();
        },
        enabled: isActuallyAuthenticated, // Only fetch when user is truly authenticated
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        placeholderData: keepPreviousData, // Keep previous data for smooth transitions
        select: (data: IAdminPage[]) => {
            // Ensure data is an array to prevent undefined errors
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
                        other: []
                    },
                    hierarchicalPages: [],
                    categorizedRegularPages: {
                        menu: [],
                        footer: [],
                        other: []
                    }
                };
            }

            // Separate configuration pages (id_type > 3) and regular pages
            const configurationPages = data.filter(page => page.id_type && page.id_type > 3);
            const regularPages = data.filter(page => !page.id_type || page.id_type <= 3);

            const systemPages = data.filter(page => page.is_system === 1 && (!page.id_type || page.id_type <= 3));

            // Helper function to get page label for admin interface (always use keyword)
            const getAdminLabel = (page: IAdminPage): string => {
                return page.keyword;
            };

            // Build system page links (empty for now since no system pages identified)
            const systemPageLinks: ISystemPageLink[] = [];

            // Build configuration page links (sorted by nav_position)
            const configurationPageLinks: IConfigurationPageLink[] = configurationPages
                .sort((a, b) => (a.nav_position || 0) - (b.nav_position || 0))
                .map(page => ({
                    label: page.keyword,
                    link: `/admin/pages/${page.keyword}`,
                    keyword: page.keyword,
                    id: page.id_pages,
                    title: page.keyword,
                    nav_position: page.nav_position
                }));

            // Categorize system pages based on is_system field
            const currentSystemPages = data.filter(page => page.is_system === 1);
            const categorizedSystemPages = {
                authentication: currentSystemPages.filter(page => page.keyword?.toLowerCase().includes('auth') || page.keyword?.toLowerCase().includes('login')).map(page => ({
                    label: page.keyword,
                    link: `/admin/pages/${page.keyword}`,
                    keyword: page.keyword,
                    id: page.id_pages,
                    title: page.keyword
                })),
                profile: currentSystemPages.filter(page => page.keyword?.toLowerCase().includes('profile')).map(page => ({
                    label: page.keyword,
                    link: `/admin/pages/${page.keyword}`,
                    keyword: page.keyword,
                    id: page.id_pages,
                    title: page.keyword
                })),
                errors: currentSystemPages.filter(page => page.keyword?.toLowerCase().includes('error') || page.keyword?.toLowerCase().includes('404')).map(page => ({
                    label: page.keyword,
                    link: `/admin/pages/${page.keyword}`,
                    keyword: page.keyword,
                    id: page.id_pages,
                    title: page.keyword
                })),
                legal: currentSystemPages.filter(page => page.keyword?.toLowerCase().includes('privacy') || page.keyword?.toLowerCase().includes('terms') || page.keyword?.toLowerCase().includes('legal')).map(page => ({
                    label: page.keyword,
                    link: `/admin/pages/${page.keyword}`,
                    keyword: page.keyword,
                    id: page.id_pages,
                    title: page.keyword
                })),
                other: currentSystemPages.filter(page =>
                    !page.keyword?.toLowerCase().includes('auth') &&
                    !page.keyword?.toLowerCase().includes('login') &&
                    !page.keyword?.toLowerCase().includes('profile') &&
                    !page.keyword?.toLowerCase().includes('error') &&
                    !page.keyword?.toLowerCase().includes('404') &&
                    !page.keyword?.toLowerCase().includes('privacy') &&
                    !page.keyword?.toLowerCase().includes('terms') &&
                    !page.keyword?.toLowerCase().includes('legal')
                ).map(page => ({
                    label: page.keyword,
                    link: `/admin/pages/${page.keyword}`,
                    keyword: page.keyword,
                    id: page.id_pages,
                    title: page.keyword
                }))
            };

            // Build hierarchical structure from flat array using parent relationships
            const buildHierarchy = (pages: IAdminPage[], parentId: number | null = null, level: number = 0): IPageHierarchy[] => {
                const children = pages.filter(page => page.parent === parentId);


                return children.map(page => {
                    // Parse CRUD permissions from the crud field
                    const permissions = parseCrudPermissions(page.crud);

                    // Get direct children
                    const childPages = buildHierarchy(pages, page.id_pages, level + 1);

                    // Sort children based on parent page's position type
                    let sortedChildren = childPages;
                    if (page.nav_position !== null) {
                        // Parent is in navigation - sort children by nav_position
                        sortedChildren = childPages.sort((a, b) => (a.nav_position || 0) - (b.nav_position || 0));
                    } else if (page.footer_position !== null) {
                        // Parent is in footer - sort children by footer_position
                        sortedChildren = childPages.sort((a, b) => (a.footer_position || 0) - (b.footer_position || 0));
                    } else {
                        // No specific position - sort by keyword
                        sortedChildren = childPages.sort((a, b) => a.keyword.localeCompare(b.keyword));
                    }

                    return {
                        id: page.id_pages,
                        id_pages: page.id_pages, // For compatibility with IAdminPage
                        keyword: page.keyword,
                        label: getAdminLabel(page),
                        link: `/admin/pages/${page.keyword}`,
                        url: page.url, // For compatibility with IAdminPage
                        parent: page.parent, // For compatibility with IAdminPage
                        id_type: page.id_type, // For compatibility with IAdminPage
                        hasChildren: sortedChildren.length > 0,
                        children: sortedChildren,
                        level,
                        nav_position: page.nav_position,
                        footer_position: page.footer_position,
                        is_system: page.is_system,
                        is_headless: page.is_headless,
                        is_open_access: page.is_open_access,
                        id_pageAccessTypes: page.id_pageAccessTypes,
                        crud: page.crud,
                        permissions
                    };
                });
            };

            // Build the hierarchical structure starting from root pages (parent = null)
            const hierarchicalPages = buildHierarchy(regularPages);


            // Categorize regular pages based on their positions (for backward compatibility)
            const menuPages = hierarchicalPages.filter(page =>
                page.nav_position !== null && page.nav_position !== undefined
            );

            const footerPages = hierarchicalPages.filter(page =>
                page.footer_position !== null && page.footer_position !== undefined
            );

            const otherRegularPages = hierarchicalPages.filter(page =>
                (page.nav_position === null || page.nav_position === undefined) &&
                (page.footer_position === null || page.footer_position === undefined)
            );


            const categorizedRegularPages: ICategorizedPages = {
                menu: menuPages.sort((a, b) => (a.nav_position || 0) - (b.nav_position || 0)),
                footer: footerPages.sort((a, b) => (a.footer_position || 0) - (b.footer_position || 0)),
                other: otherRegularPages.sort((a, b) => a.label.localeCompare(b.label))
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
                categorizedRegularPages
            };
        },
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Use cached data first for faster navigation
        refetchOnReconnect: true, // Refetch when connection is restored
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
            other: [] as ISystemPageLink[]
        },
        hierarchicalPages: data?.hierarchicalPages || [],
        categorizedRegularPages: data?.categorizedRegularPages || {
            menu: [],
            footer: [],
            other: []
        },
        isLoading,
        isFetching,
        error
    };
}

