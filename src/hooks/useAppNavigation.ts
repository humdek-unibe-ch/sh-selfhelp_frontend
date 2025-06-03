/**
 * Custom hook for managing application navigation and menu structure.
 * Provides functionality to fetch and transform navigation data from the API
 * into routes and menu items compatible with the application's layout system.
 * 
 * @module hooks/useAppNavigation
 */

import { useQuery } from '@tanstack/react-query';
import { NavigationApi } from '../api/navigation.api';
import { IPageItem } from '../types/responses/frontend/frontend.types';

interface INavigationData {
    pages: IPageItem[];
    menuPages: IPageItem[];
    footerPages: IPageItem[];
}

/**
 * Unified hook for fetching and managing navigation data for both admin and user interfaces.
 * Uses React Query for data fetching and caching with select to transform data once.
 * @returns {Object} Object containing organized navigation data and query state
 */
export function useAppNavigation() {
    const { data, isLoading, error } = useQuery< IPageItem[], Error, INavigationData >({
        queryKey: ['pages'],
        queryFn: NavigationApi.getPages,
        staleTime: 1000,
        refetchOnWindowFocus: false,
        select: (pages: IPageItem[]): INavigationData => {
            // Transform data once and cache the result
            const menuPages = pages
                .filter(page => page.nav_position !== null && !page.is_headless)
                .sort((a, b) => (a.nav_position ?? 0) - (b.nav_position ?? 0));

            const footerPages = pages
                .filter(page => page.footer_position !== null && !page.is_headless)
                .sort((a, b) => (a.footer_position ?? 0) - (b.footer_position ?? 0));

            return {
                pages,
                menuPages,
                footerPages
            };
        }
    });

    return { 
        pages: data?.pages ?? [], 
        menuPages: data?.menuPages ?? [], 
        footerPages: data?.footerPages ?? [], 
        isLoading, 
        error 
    };
}
