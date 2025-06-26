/**
 * Custom hook for managing admin pages data.
 * Provides functionality to fetch and transform admin pages data from the API
 * into a structured format suitable for navigation and management interfaces.
 * 
 * @module hooks/useAdminPages
 */

import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '../api/admin.api';
import { IAdminPage } from '../types/responses/admin/admin.types';
import { debug } from '../utils/debug-logger';

export interface ISystemPageLink {
    label: string;
    link: string;
    keyword: string;
    id: number;
    children?: ISystemPageLink[];
}

export interface IPageHierarchy {
    id: number;
    keyword: string;
    label: string;
    link: string;
    hasChildren: boolean;
    children: IPageHierarchy[];
    level: number;
    nav_position: number | null;
    footer_position: number | null;
    is_system: number;
    is_headless: number;
}

export interface ICategorizedPages {
    menu: IPageHierarchy[];
    footer: IPageHierarchy[];
    other: IPageHierarchy[];
}

/**
 * Hook for fetching and managing admin pages data
 * @returns Object containing admin pages data and query state
 */
export function useAdminPages() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['adminPages'],
        queryFn: async () => {
            debug('Fetching admin pages', 'useAdminPages');
            return await AdminApi.getAdminPages();
        },
        select: (data: IAdminPage[]) => {
            // Separate system pages from regular pages
            const systemPages = data.filter(page => page.is_system === 1);
            const regularPages = data.filter(page => page.is_system === 0);
            
            // Build hierarchical structure for system pages (same as regular pages)
            const buildSystemHierarchy = (pages: IAdminPage[], parentId: number | null = null): ISystemPageLink[] => {
                return pages
                    .filter(page => page.parent === parentId)
                    .map((page): ISystemPageLink => {
                        const children = buildSystemHierarchy(pages, page.id_pages);
                        return {
                            label: page.keyword.charAt(0).toUpperCase() + page.keyword.slice(1).replace(/_/g, ' '),
                            link: `/admin/pages/${page.keyword}`,
                            keyword: page.keyword,
                            id: page.id_pages,
                            children: children.length > 0 ? children : undefined
                        };
                    });
            };

            // Build hierarchical system page links
            const systemPageLinks = buildSystemHierarchy(systemPages);
            
            // Group system pages by category for better organization
            const authPages = systemPageLinks.filter(page => 
                ['login', 'logout', 'two-factor-authentication', 'validate', 'reset_password'].includes(page.keyword)
            );
            
            const profilePages = systemPageLinks.filter(page => 
                ['profile', 'home', 'profile-link'].includes(page.keyword)
            );
            
            const errorPages = systemPageLinks.filter(page => 
                ['missing', 'no_access', 'no_access_guest'].includes(page.keyword)
            );
            
            const legalPages = systemPageLinks.filter(page => 
                ['agb', 'impressum', 'disclaimer'].includes(page.keyword)
            );
            
            const otherPages = systemPageLinks.filter(page => 
                !authPages.includes(page) && 
                !profilePages.includes(page) && 
                !errorPages.includes(page) && 
                !legalPages.includes(page)
            );
            
            const categorizedSystemPages = {
                authentication: authPages,
                profile: profilePages,
                errors: errorPages,
                legal: legalPages,
                other: otherPages
            };

            // Create hierarchical structure for regular pages
            const buildHierarchy = (pages: IAdminPage[], level = 0): IPageHierarchy[] => {
                return pages.map(page => ({
                    id: page.id_pages,
                    keyword: page.keyword,
                    label: page.keyword.charAt(0).toUpperCase() + page.keyword.slice(1),
                    link: `/admin/pages/${page.keyword}`,
                    hasChildren: Boolean(page.children && page.children.length > 0),
                    children: page.children ? buildHierarchy(page.children, level + 1) : [],
                    level,
                    // Include additional properties for sorting and display
                    nav_position: page.nav_position,
                    footer_position: page.footer_position || null,
                    is_system: page.is_system,
                    is_headless: page.is_headless
                }));
            };

            const hierarchicalPages = buildHierarchy(regularPages);

            // Categorize regular pages like system pages
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

            debug('Processed admin pages', 'useAdminPages', { 
                totalPages: data.length, 
                systemPages: systemPages.length,
                regularPages: regularPages.length,
                systemPageKeywords: systemPages.map(p => p.keyword),
                hierarchicalSystemPageLinks: systemPageLinks.length,
                hierarchicalPagesCount: hierarchicalPages.length,
                menuPagesCount: menuPages.length,
                footerPagesCount: footerPages.length,
                otherRegularPagesCount: otherRegularPages.length
            });
            
            return {
                allPages: data,
                systemPages,
                regularPages,
                systemPageLinks,
                categorizedSystemPages,
                hierarchicalPages,
                categorizedRegularPages
            };
        },
        staleTime: 1000, // 1 second
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        retry: 1
    });

    return {
        pages: data?.allPages || [],
        systemPages: data?.systemPages || [],
        regularPages: data?.regularPages || [],
        systemPageLinks: data?.systemPageLinks || [],
        categorizedSystemPages: data?.categorizedSystemPages || {
            authentication: [],
            profile: [],
            errors: [],
            legal: [],
            other: []
        },
        hierarchicalPages: data?.hierarchicalPages || [],
        categorizedRegularPages: data?.categorizedRegularPages || {
            menu: [],
            footer: [],
            other: []
        },
        isLoading,
        error
    };
}

/**
 * Hook for getting profile page data with its children for the profile dropdown
 * @returns Object containing profile link data and its children
 */
export function useProfilePages() {
    const { systemPageLinks, isLoading, error } = useAdminPages();
    
    // Find the profile-link page and its children
    const profileLinkPage = systemPageLinks.find(page => page.keyword === 'profile-link');
    
    debug('Profile pages data', 'useProfilePages', {
        totalSystemPages: systemPageLinks.length,
        profileLinkFound: !!profileLinkPage,
        profileLinkPage: profileLinkPage ? {
            keyword: profileLinkPage.keyword,
            label: profileLinkPage.label,
            childrenCount: profileLinkPage.children?.length || 0,
            children: profileLinkPage.children?.map(c => ({ keyword: c.keyword, label: c.label }))
        } : null
    });
    
    return {
        profileLinkPage,
        profileChildren: profileLinkPage?.children || [],
        isLoading,
        error
    };
}