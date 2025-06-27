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
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useAuth } from './useAuth';
import { getAccessToken } from '../utils/auth.utils';
import { debug } from '../utils/debug-logger';

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
 * Hook for fetching admin pages with hierarchical structure
 * @returns Object containing various categorized page data
 */
export function useAdminPages() {
    const { isAuthenticated, user } = useAuth();
    
    // More robust authentication check: must have Refine auth state, user data, AND access token
    const isActuallyAuthenticated = !!isAuthenticated && !!user && !!getAccessToken();

    debug('useAdminPages called', 'useAdminPages', { 
        isAuthenticated, 
        hasUser: !!user, 
        hasToken: !!getAccessToken(),
        isActuallyAuthenticated,
        queryEnabled: isActuallyAuthenticated
    });
    
    const { data, isLoading, error } = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES,
        queryFn: async () => {
            debug('Fetching admin pages', 'useAdminPages');
            return await AdminApi.getAdminPages();
        },
        enabled: isActuallyAuthenticated, // Only fetch when user is truly authenticated
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        select: (data: IAdminPage[]) => {
            // Ensure data is an array to prevent undefined errors
            if (!data || !Array.isArray(data)) {
                debug('Invalid data received', 'useAdminPages', { data });
                return {
                    allPages: [],
                    systemPages: [],
                    regularPages: [],
                    systemPageLinks: [],
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

            // Separate system pages from regular pages
            const systemPages = data.filter(page => page.is_system === 1);
            const regularPages = data.filter(page => page.is_system === 0);
            
            // Helper function to get page label for admin interface (always use keyword)
            const getAdminLabel = (page: IAdminPage): string => {
                return page.keyword;
            };
            
            // Build hierarchical structure for system pages
            const buildSystemHierarchy = (pages: IAdminPage[]): ISystemPageLink[] => {
                return pages.map((page): ISystemPageLink => {
                    return {
                        label: getAdminLabel(page), // Use keyword for admin interface
                        link: `/admin/pages/${page.keyword}`,
                        keyword: page.keyword,
                        id: page.id_pages,
                        title: page.title || page.keyword,
                        children: page.children && page.children.length > 0 
                            ? buildSystemHierarchy(page.children) 
                            : undefined
                    };
                });
            };

            // Build hierarchical system page links
            const systemPageLinks = buildSystemHierarchy(systemPages);
            
            // Group system pages by category for better organization (based on actual data)
            const authPages = systemPageLinks.filter(page => 
                ['login', 'logout', 'two-factor-authentication', 'validate', 'reset_password'].includes(page.keyword)
            );
            
            // Profile pages - find the actual profile-link page from API data
            const profilePages = systemPageLinks.filter(page => 
                page.keyword === 'profile-link' || ['profile', 'home'].includes(page.keyword)
            );
            
            const errorPages = systemPageLinks.filter(page => 
                ['missing', 'no_access', 'no_access_guest'].includes(page.keyword)
            );
            
            const legalPages = systemPageLinks.filter(page => 
                ['agb', 'impressum', 'disclaimer'].includes(page.keyword)
            );
            
            const otherPages = systemPageLinks.filter(page => 
                !authPages.some(ap => ap.keyword === page.keyword) && 
                !profilePages.some(pp => pp.keyword === page.keyword) && 
                !errorPages.some(ep => ep.keyword === page.keyword) && 
                !legalPages.some(lp => lp.keyword === page.keyword)
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
                    label: getAdminLabel(page), // Use keyword for admin interface
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

            // Categorize regular pages based on their positions
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
                otherRegularPagesCount: otherRegularPages.length,
                profilePagesInCategory: categorizedSystemPages.profile.length,
                profileLinkPage: systemPageLinks.find(p => p.keyword === 'profile-link'),
                profileLinkChildren: systemPageLinks.find(p => p.keyword === 'profile-link')?.children?.length || 0
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
        refetchOnWindowFocus: false,
        refetchOnMount: true,
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

