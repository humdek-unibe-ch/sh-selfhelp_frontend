/**
 * Custom hook for managing admin pages data.
 * Provides functionality to fetch and transform admin pages data from the API
 * into a structured format suitable for navigation and management interfaces.
 * 
 * @module hooks/useAdminPages
 */

import { useQuery } from '@tanstack/react-query';
import { IAdminPage } from '@/types/api/requests.type';
import { AdminApi } from '@/api/admin.api';

interface AdminPageItem {
    id: number;
    label: string;
    link?: string;
    children?: AdminPageItem[];
    nav_position: number | null;
}

/**
 * Transforms flat admin pages data into a hierarchical structure
 * with proper sorting based on navigation position.
 */
function transformAdminPages(pages: IAdminPage[]): AdminPageItem[] {
    // Create a map for quick page lookup
    const pageMap = new Map<number, AdminPageItem>();
    const rootPages: AdminPageItem[] = [];

    // First pass: Create all page items
    pages.forEach(page => {
        if (!page.is_headless) {
            const pageItem: AdminPageItem = {
                id: page.id_pages,
                label: page.keyword,
                link: `/admin/pages/${page.keyword}`,
                nav_position: page.nav_position,
                children: [],
            };
            pageMap.set(page.id_pages, pageItem);
        }
    });

    // Second pass: Build the tree structure
    pages.forEach(page => {
        if (!page.is_headless) {
            const pageItem = pageMap.get(page.id_pages);
            if (pageItem) {
                if (page.parent === null) {
                    rootPages.push(pageItem);
                } else {
                    const parentItem = pageMap.get(page.parent);
                    if (parentItem) {
                        if (!parentItem.children) {
                            parentItem.children = [];
                        }
                        parentItem.children.push(pageItem);
                    }
                }
            }
        }
    });

    // Sort function for pages
    const sortPages = (items: AdminPageItem[]) => {
        // Sort by nav_position (null values at the end)
        return items.sort((a, b) => {
            if (a.nav_position === null && b.nav_position === null) return 0;
            if (a.nav_position === null) return 1;
            if (b.nav_position === null) return -1;
            return a.nav_position - b.nav_position;
        });
    };

    // Sort root pages and their children
    const sortPagesRecursively = (items: AdminPageItem[]) => {
        sortPages(items);
        items.forEach(item => {
            if (item.children && item.children.length > 0) {
                sortPagesRecursively(item.children);
            }
        });
        return items;
    };

    return sortPagesRecursively(rootPages);
}

/**
 * Hook for fetching and managing admin pages data
 * @returns Object containing admin pages data and query state
 */
export function useAdminPages() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['adminPages'],
        queryFn: async () => {
            const pages = await AdminApi.getAdminPages();
            return {
                pages,
                structuredPages: transformAdminPages(pages)
            };
        },
        staleTime: 1000, // 1 second
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        retry: 1
    });

    return {
        pages: data?.pages || [],
        structuredPages: data?.structuredPages || [],
        isLoading,
        error
    };
}