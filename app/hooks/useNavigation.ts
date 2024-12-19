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
 * Converts AltoRouter-style parameters to Next.js dynamic routes
 * e.g., '/test_edit/[i:record_id]' becomes '/test_edit/[record_id]'
 */
const transformDynamicUrl = (url: string | null): string => {
    if (!url) return '/';
    
    // Replace AltoRouter patterns with Next.js dynamic route patterns
    return url.replace(/\[(i|a|s|h):([^\]]+)\]/g, '[$2]');
};

/**
 * Extracts parameter information from a URL pattern
 * e.g., '/test_edit/[i:record_id]' returns { record_id: { type: 'i' } }
 */
function extractUrlParams(url: string): Record<string, { type: string }> {
    const params: Record<string, { type: string }> = {};
    const matches = url.matchAll(/\[([ias]):([^\]]+)\]/g);
    
    for (const match of matches) {
        const [, type, name] = match;
        params[name] = { type };
    }
    
    return params;
}

/**
 * Transforms navigation items from API into route configurations.
 * @param {INavigationItem[]} items - Navigation items from API
 * @returns {IRoute[]} Array of route configurations
 */
function transformToRoutes(items: INavigationItem[]): IRoute[] {
    return items.map(item => {
        const path = transformDynamicUrl(item.url);
        return {
            title: item.keyword,
            path,
            isNav: item.nav_position !== null,
            position: item.nav_position,
            params: extractUrlParams(item.url || ''),
            protocol: item.protocol?.split('|') || ['GET']
        };
    });
}

/**
 * Transforms navigation items from API into sidebar menu items.
 * @param {INavigationItem[]} items - Navigation items from API
 * @returns {IMenuitemsType[]} Array of menu items for sidebar
 */
function transformToMenuItems(items: INavigationItem[]): IMenuitemsType[] {
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
function transformToResources(items: INavigationItem[]) {
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
 * Hook for fetching and managing navigation data.
 * Uses React Query for data fetching and caching.
 * @returns {Object} Object containing navigation data and query state
 */
export function useNavigation() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['navigation'],
        queryFn: async () => {
            const data = await NavigationService.getRoutes();
            return {
                routes: transformToRoutes(data),
                menuItems: transformToMenuItems(data),
                resources: transformToResources(data)
            };
        },
        staleTime: 1000, // 1 second
    });

    return {
        routes: data?.routes || [],
        menuItems: data?.menuItems || [],
        resources: data?.resources || [],
        isLoading,
        error
    };
}