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
import { useAuth } from './useAuth';
import { getAccessToken } from '../utils/auth.utils';
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
        queryKey: ['adminPages'],
        queryFn: async () => {
            debug('Fetching admin pages', 'useAdminPages');
            return await AdminApi.getAdminPages();
        },
        enabled: isActuallyAuthenticated, // Only fetch when user is truly authenticated
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
            
            // Helper function to get page title - use actual title from API or fallback to formatted keyword
            const getPageTitle = (page: IAdminPage): string => {
                // Use the actual title if available, otherwise format the keyword as fallback
                if (page.title && page.title.trim()) {
                    return page.title;
                }
                // Fallback to formatted keyword
                return page.keyword.charAt(0).toUpperCase() + page.keyword.slice(1).replace(/_/g, ' ').replace(/-/g, ' ');
            };
            
            // Build hierarchical structure for system pages (same as regular pages)
            const buildSystemHierarchy = (pages: IAdminPage[], parentId: number | null = null): ISystemPageLink[] => {
                return pages
                    .filter(page => page.parent === parentId)
                    .map((page): ISystemPageLink => {
                        const children = buildSystemHierarchy(pages, page.id_pages);
                        return {
                            label: getPageTitle(page), // Use title instead of formatted keyword
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
            
            // Look for individual profile-related pages instead of expecting a profile-link parent
            // Since profile-link doesn't exist in the database, we'll create a virtual structure
            const profileRelatedPages = systemPageLinks.filter(page => 
                ['profile', 'settings', 'logout'].includes(page.keyword)
            );
            
            // Create virtual profile pages if they don't exist in the database
            const virtualProfilePages = [];
            if (!profileRelatedPages.find(p => p.keyword === 'profile')) {
                virtualProfilePages.push({
                    label: 'Profile Settings',
                    link: '/admin/profile',
                    keyword: 'profile',
                    id: -1 // Virtual ID
                });
            }
            if (!profileRelatedPages.find(p => p.keyword === 'logout')) {
                virtualProfilePages.push({
                    label: 'Logout',
                    link: '#',
                    keyword: 'logout',
                    id: -2 // Virtual ID
                });
            }
            
            // Combine real and virtual profile pages
            const allProfilePages = [...profileRelatedPages, ...virtualProfilePages];
            
            // Create a virtual profile-link structure with children
            const profilePages = allProfilePages.length > 0 ? [{
                label: 'Profile',
                link: '#',
                keyword: 'profile-link',
                id: 0, // Virtual ID
                children: allProfilePages
            }] : systemPageLinks.filter(page => 
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
                    label: getPageTitle(page), // Use title instead of formatted keyword
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
    const { isAuthenticated, user } = useAuth();
    const { categorizedSystemPages, systemPageLinks, isLoading, error } = useAdminPages();
    
    // More robust authentication check: must have Refine auth state, user data, AND access token
    const isActuallyAuthenticated = !!isAuthenticated && !!user && !!getAccessToken();
    
    // Find the profile-link page from categorized pages (which includes virtual profile-link)
    const profileLinkPage = isActuallyAuthenticated ? 
        categorizedSystemPages.profile.find(page => page.keyword === 'profile-link') : null;
    
    debug('Profile pages data', 'useProfilePages', {
        isActuallyAuthenticated,
        totalSystemPages: systemPageLinks.length,
        profilePagesInCategory: categorizedSystemPages.profile.length,
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