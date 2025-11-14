/**
 * Custom hook for managing application navigation and menu structure.
 * Provides functionality to fetch and transform navigation data from the API
 * into routes and menu items compatible with the application's layout system.
 * 
 * @module hooks/useAppNavigation
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { NavigationApi, transformPageData } from '../api/navigation.api';
import { IPageItem } from '../types/responses/frontend/frontend.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useLanguageContext } from '../app/components/contexts/LanguageContext';

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
export function useAppNavigation(options: { isAdmin?: boolean; forceRefresh?: boolean } = {}) {
    const { isAdmin = false, forceRefresh = false } = options;
    const { currentLanguageId } = useLanguageContext();
    
    const { data, isLoading, error, isFetching } = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FRONTEND_PAGES(currentLanguageId),
        queryFn: () => {
            return NavigationApi.getPagesWithLanguage(currentLanguageId);
        },
        enabled: true, // Always enabled since currentLanguageId will default to 1
        staleTime: forceRefresh ? 0 : REACT_QUERY_CONFIG.CACHE.staleTime, // Force fresh data when needed
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        refetchOnWindowFocus: false,
        refetchOnMount: forceRefresh, // Refetch when forced refresh is needed
        retry: 3, // Use global retry setting
        placeholderData: keepPreviousData, // Keep previous data during refetch for smooth transitions
        select: (rawPages: any[]): INavigationData => {
            // Transform raw API data to IPageItem format (cached by React Query)
            const pages = rawPages.map(transformPageData);

            // Fix child page URLs to use direct paths instead of nested paths
            const fixChildPageUrls = (pageList: IPageItem[]): IPageItem[] => {
                return pageList.map(page => {
                    const fixedPage = { ...page };
                    
                    // For child pages (pages with parent), use direct URL based on keyword
                    if (page.parent_page_id && page.keyword) {
                        fixedPage.url = `/${page.keyword}`;
                    }
                    
                    // Recursively fix children URLs
                    if (page.children && page.children.length > 0) {
                        fixedPage.children = fixChildPageUrls(page.children);
                    }
                    
                    return fixedPage;
                });
            };

            // Apply URL fixes to all pages
            const fixedPages = fixChildPageUrls(pages);

            // Transform data once and cache the result
            const menuPages = fixedPages
                .filter(page => page.nav_position !== null && !page.is_headless)
                .sort((a, b) => (a.nav_position ?? 0) - (b.nav_position ?? 0));

            const footerPages = fixedPages
                .filter(page => page.footer_position !== null && !page.is_headless)
                .sort((a, b) => (a.footer_position ?? 0) - (b.footer_position ?? 0));

            const profilePages = fixedPages
                .filter(page => page.is_system === true && page.keyword === 'profile-link')
                .sort((a, b) => (a.nav_position ?? 0) - (b.nav_position ?? 0));

            // Flatten ALL pages (including children) for route checking
            const routes = flattenPages(fixedPages);

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
                        parent: page.parent_page_id ? pages.find(p => p.id_pages === page.parent_page_id)?.keyword : undefined,
                        canDelete: true,
                        nav: page.nav_position !== null,
                        navOrder: page.nav_position,
                        footer: page.footer_position !== null,
                        footerOrder: page.footer_position,
                        params: page.url?.includes('[') ? { nav: { type: 'number' } } : {},
                        protocol: ['web']
                    }
                }));

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
