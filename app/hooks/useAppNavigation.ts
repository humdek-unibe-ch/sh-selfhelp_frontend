/**
 * Custom hook for managing application navigation and menu structure.
 * Provides functionality to fetch and transform navigation data from the API
 * into routes and menu items compatible with the application's layout system.
 * 
 * @module hooks/useAppNavigation
 */

import { useQuery } from '@tanstack/react-query';
import { IResource, IRoute, NavItem } from '@/types/navigation/navigation.types';
import { IMenuitemsType } from '@/types/layout/sidebar';
import { IconPoint, IconLayoutNavbar, IconFiles } from '@tabler/icons-react';
import { NavigationApi } from '@/api/navigation.api';
import { IPageItem } from '@/types/responses/frontend/frontend.types';

/**
 * Converts AltoRouter-style parameters to Next.js app router dynamic routes
 * e.g., '/nav/[i:nav]' becomes '/nav/[...slug]'
 */
const transformDynamicUrl = (url: string | null): string => {
    if (!url) return '/';
    
    // Check if it's a dynamic route
    if (url.includes('[')) {
        return `/`;
    }
    
    return url;
};

/**
 * Extracts parameter information from a URL pattern
 * e.g., '/test_edit/[i:record_id]' returns { record_id: { type: 'i' } }
 */
function extractUrlParams(url: string): Record<string, { type: string }> {
    const params: Record<string, { type: string }> = {};
    // Convert matchAll result to array before iterating
    const matches = Array.from(url.matchAll(/\[([ias]):([^\]]+)\]/g));
    
    for (const match of matches) {
        const [, type, name] = match;
        params[name] = { type };
    }
    
    return params;
}

/**
 * Transforms navigation items from API into route configurations.
 * @param {IPage[]} pages - Navigation items from API
 * @returns {IRoute[]} Array of route configurations
 */
function transformToRoutes(pages: IPageItem[]): IRoute[] {
    console.log('transformToRoutes called with pages:', pages);
    if (!Array.isArray(pages)) {
        console.error('transformToRoutes: Expected an array but received:', pages);
        return [];
    }
    
    console.log(`Processing ${pages.length} pages`);
    
    const result = pages.map((page, index) => {
        console.log(`Processing page ${index + 1}:`, page);
        try {
            const path = transformDynamicUrl(page.url);
            console.log(`Transformed path for ${page.keyword}:`, path);
            
            const route = {
                title: page.keyword,
                path,
                isNav: page.nav_position !== null,
                position: page.nav_position,
                params: extractUrlParams(page.url || ''),
                protocol: page.protocol?.split('|') || ['GET']
            };
            
            console.log(`Created route for ${page.keyword}:`, route);
            return route;
        } catch (error) {
            console.error(`Error processing page ${page.keyword || 'unknown'}:`, error);
            return null;
        }
    }).filter(Boolean) as IRoute[]; // Filter out any null values from failed mappings
    
    console.log('Final transformed routes:', result);
    return result;
}

/**
 * Transforms navigation items from API into sidebar menu items.
 * @param {IPage[]} items - Navigation items from API
 * @returns {IMenuitemsType[]} Array of menu items for sidebar
 */
function transformToMenuItems(items: IPageItem[]): IMenuitemsType[] {
    const rootItems = items
        .filter(item => 
            item.nav_position !== null && 
            item.parent === null &&
            !item.is_headless
        )
        .sort((a, b) => (a.nav_position ?? 0) - (b.nav_position ?? 0));

    // Transform to serializable format first
    const serializableItems = rootItems.map(item => {
        const childItems = items
            .filter(child => 
                child.parent === item.id_pages &&
                child.nav_position !== null &&
                !child.is_headless
            )
            .sort((a, b) => (a.nav_position ?? 0) - (b.nav_position ?? 0));

        return {
            id: item.id_pages.toString(),
            title: item.keyword,
            href: transformDynamicUrl(item.url) || '#',
            external: false,
            children: childItems.length > 0 ? childItems.map(child => ({
                id: child.id_pages.toString(),
                title: child.keyword,
                href: transformDynamicUrl(child.url) || '#',
                external: false,
                hasIcon: true
            })) : undefined
        };
    });

    // Add icons after retrieving from store
    return serializableItems.map(item => ({
        ...item,
        icon: null,
        children: item.children?.map(child => ({
            ...child,
            icon: IconPoint
        }))
    }));
}

/**
 * Converts routes to Refine resources
 */
function transformToResources(items: IPageItem[]): IResource[] {
    return items.map(item => {
        const path = transformDynamicUrl(item.url);
        const params = extractUrlParams(item.url || '');
        
        return {
            name: item.keyword,
            meta: {
                label: item.keyword,
                parent: item.parent?.toString(),
                canDelete: false,
                nav: item.nav_position !== null,
                navOrder: item.nav_position,
                footer: item.footer_position !== null,
                footerOrder: item.footer_position,
                params,
                protocol: item.protocol?.split('|') || ['GET']
            },
            list: path,
            show: path,
        };
    });
}

/**
 * Transforms navigation items from API response into NavItem format for admin navigation
 */
const transformNavigationToNavItems = (navigationData: IPageItem[]): NavItem[] => {
    // First, create a map of all items
    const itemsMap = new Map<number, NavItem>();
    
    // Initialize items without handling parent relationships
    navigationData.forEach(item => {
        if (!itemsMap.has(item.id_pages)) {
            itemsMap.set(item.id_pages, {
                id: item.id_pages,
                label: item.keyword,
                link: '/admin/pages/'+item.id_pages,
                initiallyOpened: true,
                icon: item.nav_position !== null ? IconLayoutNavbar : IconFiles,
                isInMenu: item.nav_position !== null,
                links: []
            });
        }
    });

    // Create the hierarchy
    const rootItems: NavItem[] = [];
    navigationData.forEach(item => {
        const navItem = itemsMap.get(item.id_pages);
        if (navItem) {
            if (item.parent === null) {
                rootItems.push(navItem);
            } else {
                const parentItem = itemsMap.get(item.parent);
                if (parentItem) {
                    if (!parentItem.links) {
                        parentItem.links = [];
                    }
                    parentItem.links.push(navItem);
                }
            }
        }
    });

    // Sort items by nav_position if available
    const sortByNavPosition = (items: NavItem[]) => {
        return items.sort((a, b) => {
            const aPos = navigationData.find(n => n.id_pages === a.id)?.nav_position ?? Infinity;
            const bPos = navigationData.find(n => n.id_pages === b.id)?.nav_position ?? Infinity;
            return aPos - bPos;
        });
    };

    // Sort root items and their children recursively
    const sortNavigationRecursive = (items: NavItem[]) => {
        items = sortByNavPosition(items);
        items.forEach(item => {
            if (item.links && item.links.length > 0) {
                item.links = sortNavigationRecursive(item.links);
            }
        });
        return items;
    };

    // Create a Pages parent that wraps all items
    const pagesParent: NavItem = {
        label: 'Pages',
        icon: IconFiles,
        initiallyOpened: true,
        links: sortNavigationRecursive(rootItems)
    };

    return [pagesParent];
};

/**
 * Unified hook for fetching and managing navigation data for both admin and user interfaces.
 * Uses React Query for data fetching and caching.
 * @param {Object} options - Hook options
 * @param {boolean} options.isAdmin - Whether to fetch admin navigation
 * @returns {Object} Object containing navigation data and query state
 */
export function useAppNavigation({ isAdmin = false } = {}) {
    const queryKey = isAdmin ? ['admin-navigation'] : ['navigation'];

    const { data, isLoading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            const data = await NavigationApi.getPages();
            if (isAdmin) {
                const navItems = transformNavigationToNavItems(data);
                return {
                    navItems,
                    resources: []
                };
            }
            return {
                routes: transformToRoutes(data),
                menuItems: transformToMenuItems(data),
                resources: transformToResources(data)
            };
        },
        staleTime: 1000, // 1 second
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        retry: 1
    });

    if (isAdmin) {
        return {
            navItems: data?.navItems || [],
            resources: [],
            isLoading,
            error
        };
    }

    return {
        routes: data?.routes || [],
        menuItems: data?.menuItems || [],
        resources: data?.resources || [],
        isLoading,
        error
    };
}
