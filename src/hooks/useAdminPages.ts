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
    is_system: number;
    is_headless: number;
}

export interface ICategorizedPages {
    navigation: IPageHierarchy[];
    headless: IPageHierarchy[];
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
            
            // Transform system pages into navigation links format
            const systemPageLinks = systemPages.map((page): ISystemPageLink => ({
                label: page.keyword.charAt(0).toUpperCase() + page.keyword.slice(1).replace(/_/g, ' '),
                link: `/admin/pages/${page.keyword}`,
                keyword: page.keyword,
                id: page.id_pages
            }));
            
            // Group system pages by category for better organization
            const authPages = systemPageLinks.filter(page => 
                ['login', 'two-factor-authentication', 'validate', 'reset_password'].includes(page.keyword)
            );
            
            const profilePages = systemPageLinks.filter(page => 
                ['profile', 'home'].includes(page.keyword)
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
                    is_system: page.is_system,
                    is_headless: page.is_headless
                }));
            };

            const hierarchicalPages = buildHierarchy(regularPages);

            // Categorize regular pages like system pages
            const navigationPages = hierarchicalPages.filter(page => 
                page.nav_position !== null && page.nav_position !== undefined
            );
            
            const headlessPages = hierarchicalPages.filter(page => 
                page.is_headless === 1 && (page.nav_position === null || page.nav_position === undefined)
            );
            
            const otherRegularPages = hierarchicalPages.filter(page => 
                page.nav_position === null && page.is_headless === 0
            );

            const categorizedRegularPages: ICategorizedPages = {
                navigation: navigationPages.sort((a, b) => (a.nav_position || 0) - (b.nav_position || 0)),
                headless: headlessPages.sort((a, b) => a.label.localeCompare(b.label)),
                other: otherRegularPages.sort((a, b) => a.label.localeCompare(b.label))
            };

            debug('Processed admin pages', 'useAdminPages', { 
                totalPages: data.length, 
                systemPages: systemPages.length,
                regularPages: regularPages.length,
                systemPageKeywords: systemPages.map(p => p.keyword),
                hierarchicalPagesCount: hierarchicalPages.length,
                navigationPagesCount: navigationPages.length,
                headlessPagesCount: headlessPages.length,
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
            navigation: [],
            headless: [],
            other: []
        },
        isLoading,
        error
    };
}