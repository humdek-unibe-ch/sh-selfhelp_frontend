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
            const allNavigationKeywords = [
                ...menuPages.map(page => page.keyword),
                ...menuPages.flatMap(page => page.children?.map(child => child.keyword) || []),
                ...footerPages.map(page => page.keyword),
            ].filter(Boolean); // Remove any undefined values
            
            if (allNavigationKeywords.length > 0) {
                // Prefetch all navigation pages in the background
                prefetchPages(allNavigationKeywords);
            }
        }
    }, [menuPages, footerPages, isLoading, prefetchPages]);
    
    return {
        isNavigationReady: !isLoading && (menuPages.length > 0 || footerPages.length > 0),
        totalNavigationPages: menuPages.length + footerPages.length,
    };
}
