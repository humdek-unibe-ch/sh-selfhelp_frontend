/**
 * Custom hook for prefetching navigation pages on app initialization.
 * Automatically prefetches all navigation pages when the app loads to ensure
 * instant navigation throughout the application.
 * 
 * @module hooks/useNavigationPrefetch
 */

import { useEffect } from 'react';
import { useAppNavigation } from './useAppNavigation';
import { usePagePrefetch } from './usePagePrefetch';
import { IPageItem } from '../types/common/pages.type';

/**
 * Hook that automatically prefetches all navigation pages when they become available.
 * This ensures that users can navigate instantly to any page in the navigation
 * without seeing loading spinners.
 * 
 * Should be used at the app level to initialize prefetching.
 */
export function useNavigationPrefetch() {
    const { menuPages, footerPages, isLoading } = useAppNavigation();
    const { prefetchPages } = usePagePrefetch();
    
    // Prefetch all navigation pages when navigation data becomes available
    useEffect(() => {
        if (!isLoading && (menuPages.length > 0 || footerPages.length > 0)) {
            const allNavigationPageIds = [
                ...menuPages.map(page => page.id_pages),
                ...menuPages.flatMap(page => page.children?.map((child: IPageItem) => child.id_pages) || []),
                ...footerPages.map(page => page.id_pages),
            ].filter(Boolean); // Remove any undefined values
            
            if (allNavigationPageIds.length > 0) {
                // Filter out undefined values and prefetch all navigation pages in the background
                const validPageIds = allNavigationPageIds.filter((id): id is number => id !== undefined);
                prefetchPages(validPageIds);
            }
        }
    }, [menuPages, footerPages, isLoading, prefetchPages]);
    
    return {
        isNavigationReady: !isLoading && (menuPages.length > 0 || footerPages.length > 0),
        totalNavigationPages: menuPages.length + footerPages.length,
    };
}
