/**
 * Custom hook for managing application navigation and menu structure.
 * Provides functionality to fetch and transform navigation data from the API
 * into routes and menu items compatible with the application's layout system.
 * 
 * @module hooks/useNavigation
 */

import { useQuery } from '@tanstack/react-query';
import { NavigationService } from '@/services/navigation.service';
import { IRoute } from '@/types/navigation/navigation.types';
import { IMenuitemsType } from '@/types/layout/sidebar';
import { IconPoint } from '@tabler/icons-react';
import { INavigationItem } from '@/types/api/navigation.type';

/**
 * Interface for navigation data returned by the hook.
 * Contains routes and menu items for the application.
 */
interface INavigationData {
    routes: IRoute[];
    menuItems: IMenuitemsType[];
}

/**
 * Transforms legacy dynamic URLs to Next.js compatible format.
 * @param {string} url - The URL to transform
 * @returns {string} Transformed URL with dynamic segments removed
 */
function transformDynamicUrl(url: string): string {
    if (!url) return url;
    
    // Remove all dynamic segments between square brackets
    url = url.replace(/\/\[([^\]]+)\]/g, '');
    
    // Remove any double slashes that might result from removing segments
    url = url.replace(/\/+/g, '/');
    
    // Remove trailing slash if present
    url = url.replace(/\/$/, '');
    
    return url;
}

/**
 * Transforms navigation items from API into route configurations.
 * @param {INavigationItem[]} items - Navigation items from API
 * @returns {IRoute[]} Array of route configurations
 */
function transformToRoutes(items: INavigationItem[]): IRoute[] {
    return items.map(item => ({
        title: item.keyword,
        path: transformDynamicUrl(item.url),
        isNav: item.nav_position !== null,
        position: item.nav_position
    }));
}

/**
 * Transforms navigation items from API into sidebar menu items.
 * @param {INavigationItem[]} items - Navigation items from API
 * @returns {IMenuitemsType[]} Array of menu items for sidebar
 */
function transformToMenuItems(items: INavigationItem[]): IMenuitemsType[] {
    // First, get all root items (items with no parent or parent is null)
    const rootItems = items
        .filter(item => 
            item.nav_position !== null && 
            item.parent === null &&
            !item.is_headless // Exclude headless items
        )
        .sort((a, b) => (a.nav_position ?? 0) - (b.nav_position ?? 0));

    // Transform each root item and its children
    return rootItems.map(item => {
        // Find all immediate children of this item
        const childItems = items
            .filter(child => 
                child.parent === item.id_pages &&
                child.nav_position !== null &&
                !child.is_headless
            )
            .sort((a, b) => (a.nav_position ?? 0) - (b.nav_position ?? 0));

        const menuItem: IMenuitemsType = {
            id: item.id_pages.toString(),
            title: item.keyword,
            href: transformDynamicUrl(item.url) || '#',
            icon: null,
            external: false
        };

        // If this item has children, add them
        if (childItems.length > 0) {
            menuItem.children = childItems.map(child => ({
                id: child.id_pages.toString(),
                title: child.keyword,
                href: transformDynamicUrl(child.url) || '#',
                icon: IconPoint,
                external: false
            }));
        }

        return menuItem;
    });
}

/**
 * Hook for fetching and managing navigation data.
 * Uses React Query for data fetching and caching.
 * @returns {Object} Object containing navigation data and query state
 */
export const useNavigation = () => {
    const { 
        data, 
        isLoading, 
        isFetching,
        isSuccess,
        error 
    } = useQuery({
        queryKey: ['navigation'],
        queryFn: async () => {
            const data = await NavigationService.getRoutes();
            return {
                routes: transformToRoutes(data),
                menuItems: transformToMenuItems(data)
            };
        },
        staleTime: 1000,
    });

    return {
        routes: data?.routes ?? [],
        menuItems: data?.menuItems ?? [],
        isLoading,
        isFetching,
        isSuccess,
        error
    };
};