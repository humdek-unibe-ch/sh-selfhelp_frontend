import { useQuery } from '@tanstack/react-query';
import { IconLayoutNavbar, IconFiles } from '@tabler/icons-react';
import { INavigationItem } from '@/types/api/navigation.type';
import { NavigationApi } from '@/api/navigation.api';

export interface NavItem {
  label: string;
  link?: string;
  icon?: any;
  initiallyOpened?: boolean;
  links?: NavItem[];
  id?: number;
  isInMenu?: boolean;
}

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
 * Transforms navigation items from API response into NavItem format for admin navigation
 */
const transformNavigationToNavItems = (navigationData: INavigationItem[]): NavItem[] => {
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
        icon: item.nav_position !== null ? IconLayoutNavbar : undefined,
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
 * Hook for fetching and managing admin navigation data.
 * Uses React Query for data fetching and caching.
 */
export const useAdminNavigation = () => {
    const { data: adminNavigationData, isLoading, error } = useQuery({
        queryKey: ['admin-navigation'],
        queryFn: NavigationApi.getRoutes,
    });

    const navItems = adminNavigationData ? transformNavigationToNavItems(adminNavigationData) : [];

    return {
        navItems,
        isLoading,
        error,
    };
};

export type { NavItem };
