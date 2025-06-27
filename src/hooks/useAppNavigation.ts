/**
 * Custom hook for managing application navigation and menu structure.
 * Provides functionality to fetch and transform navigation data from the API
 * into routes and menu items compatible with the application's layout system.
 * 
 * @module hooks/useAppNavigation
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { NavigationApi } from '../api/navigation.api';
import { IPageItem } from '../types/responses/frontend/frontend.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useLanguageContext } from '../app/contexts/LanguageContext';
import { debug } from '../utils/debug-logger';

interface INavigationData {
    pages: IPageItem[];
    menuPages: IPageItem[];
    footerPages: IPageItem[];
    profilePages: IPageItem[];
    routes: IPageItem[];
    resources?: any[]; // Refine resources for admin mode
}

/**
 * Recursively flattens a tree structure of pages into a flat array
 * @param pages - Array of pages that may contain children
 * @returns Flat array of all pages (including nested children)
 */
function flattenPages(pages: IPageItem[]): IPageItem[] {
    let result: IPageItem[] = [];
    for (const page of pages) {
        // Add the current page (without children to avoid circular references)
        result.push({ ...page, children: [] });
        
        // Recursively add all children
        if (page.children && page.children.length > 0) {
            result = result.concat(flattenPages(page.children));
        }
    }
    return result;
}

/**
 * Unified hook for fetching and managing navigation data for both admin and user interfaces.
 * Uses React Query for data fetching and caching with select to transform data once.
 * Now uses language-specific endpoint to ensure titles are always available.
 * @param {Object} options - Configuration options
 * @param {boolean} options.isAdmin - Whether to generate admin resources for Refine
 * @returns {Object} Object containing organized navigation data and query state
 */
export function useAppNavigation(options: { isAdmin?: boolean } = {}) {
    const { isAdmin = false } = options;
    const { currentLanguageId } = useLanguageContext();
    
    const { data, isLoading, error, isFetching } = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FRONTEND_PAGES(currentLanguageId),
        queryFn: () => {
            debug('Fetching pages with language', 'useAppNavigation', { languageId: currentLanguageId });
            return NavigationApi.getPagesWithLanguage(currentLanguageId);
        },
        enabled: true, // Always enabled since currentLanguageId will default to 1
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Don't refetch on mount if data exists
        retry: 3, // Use global retry setting
        placeholderData: keepPreviousData, // Keep previous data during refetch for smooth transitions
        select: (pages: IPageItem[]): INavigationData => {
            debug('Transform: Raw pages from API with language', 'useAppNavigation', { 
                count: pages.length,
                languageId: currentLanguageId,
                pagesWithTitles: pages.filter(p => p.title).length
            });
            
            // Transform data once and cache the result
            const menuPages = pages
                .filter(page => page.nav_position !== null && !page.is_headless)
                .sort((a, b) => (a.nav_position ?? 0) - (b.nav_position ?? 0));

            const footerPages = pages
                .filter(page => page.footer_position !== null && !page.is_headless)
                .sort((a, b) => (a.footer_position ?? 0) - (b.footer_position ?? 0));

            const profilePages = pages
                .filter(page => page.is_system === 1 && page.keyword === 'profile-link')
                .sort((a, b) => (a.nav_position ?? 0) - (b.nav_position ?? 0));

            // Flatten ALL pages (including children) for route checking
            const routes = flattenPages(pages);

            const transformResults = {
                totalPages: pages.length,
                menuPages: menuPages.length,
                footerPages: footerPages.length,
                profilePages: profilePages.length,
                flattenedRoutes: routes.length,
                routeKeywords: routes.map(r => r.keyword),
                languageId: currentLanguageId,
                pagesWithTitles: pages.filter(p => p.title && p.title.trim()).length,
                pagesWithoutTitles: pages.filter(p => !p.title || !p.title.trim()).length
            };

            debug('Transform: Results with language support', 'useAppNavigation', transformResults);

            // Generate Refine resources for admin mode
            let resources: any[] = [];
            if (isAdmin) {
                resources = pages.map(page => ({
                    name: page.keyword,
                    list: `/admin/pages/${page.keyword}`,
                    show: `/admin/pages/${page.keyword}`,
                    edit: `/admin/pages/${page.keyword}/edit`,
                    create: `/admin/pages/create`,
                    meta: {
                        label: page.title || page.keyword, // Use title if available, fallback to keyword
                        parent: page.parent ? pages.find(p => p.id_pages === page.parent)?.keyword : undefined,
                        canDelete: true,
                        nav: page.nav_position !== null,
                        navOrder: page.nav_position,
                        footer: page.footer_position !== null,
                        footerOrder: page.footer_position,
                        params: page.url.includes('[') ? { nav: { type: 'number' } } : {},
                        protocol: ['web']
                    }
                }));
                
                debug('Generated Refine resources for admin with titles', 'useAppNavigation', { 
                    resourcesCount: resources.length,
                    isAdmin,
                    resourcesWithTitles: resources.filter(r => r.meta.label !== r.name).length
                });
            }

            const result = {
                pages,
                menuPages,
                footerPages,
                profilePages,
                routes,
                resources
            };

            // Store transformed data in window for DevTools inspection
            if (typeof window !== 'undefined') {
                (window as any).__NAVIGATION_DATA__ = result;
                debug('Transformed data with language support stored in window.__NAVIGATION_DATA__', 'useAppNavigation');
            }

            return result;
        }
    });

    return { 
        pages: data?.pages ?? [], 
        menuPages: data?.menuPages ?? [], 
        footerPages: data?.footerPages ?? [], 
        profilePages: data?.profilePages ?? [],
        routes: data?.routes ?? [],
        resources: data?.resources ?? [],
        isLoading: isLoading, 
        error,
        isFetching
    };
}
