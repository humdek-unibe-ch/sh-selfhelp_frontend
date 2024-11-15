import { useQuery } from '@tanstack/react-query';
import { NavigationService } from '@/services/api.service';
import { NavigationItem, Route } from '@/types/navigation/navigation.types';
import { MenuitemsType } from '@/types/layout/sidebar';
import { IconLayoutDashboard, IconPoint } from '@tabler/icons-react';

function transformToMenuItems(items: NavigationItem[]): MenuitemsType[] {
  return items
    .filter(item => item.nav_position !== null)
    .sort((a, b) => (a.nav_position ?? 0) - (b.nav_position ?? 0))
    .map(item => {
      const childItems = items
        .filter(child => child.parent === item.id_pages)
        .sort((a, b) => (a.nav_position ?? 0) - (b.nav_position ?? 0));

      const menuItem: MenuitemsType = {
        id: item.id_pages.toString(),
        title: item.keyword,
        href: item.url,
        icon: null,
        external: false
      };

      if (childItems.length > 0) {
        menuItem.children = childItems.map(child => ({
          id: child.id_pages.toString(),
          title: child.keyword,
          href: child.url,
          icon: IconPoint,
          disabled: child.id_pageAccessTypes !== 1,
          external: false
        }));
      }

      return menuItem;
    });
}

function transformToRoutes(items: NavigationItem[]): Route[] {
  return items.map(item => ({
    title: item.keyword,
    path: item.url,
    isNav: item.nav_position !== null,
    position: item.nav_position
  }));
}

export function useNavigation() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['navigation'],
    queryFn: NavigationService.getRoutes,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  return {
    routes: data ? transformToRoutes(data) : [],
    menuItems: data ? transformToMenuItems(data) : [],
    isLoading,
    error
  };
}