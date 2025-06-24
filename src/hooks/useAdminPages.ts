/**
 * Custom hook for managing admin pages data.
 * Provides functionality to fetch and transform admin pages data from the API
 * into a structured format suitable for navigation and management interfaces.
 * 
 * @module hooks/useAdminPages
 */

import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '../api/admin.api';
import { IAdminPage } from '../types/responses/admin/admin.types';
import { debug } from '../utils/debug-logger';

export interface ISystemPageLink {
    label: string;
    link: string;
    keyword: string;
    id: number;
}

/**
 * Hook for fetching and managing admin pages data
 * @returns Object containing admin pages data and query state
 */
export function useAdminPages() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['adminPages'],
        queryFn: async () => {
            debug('Fetching admin pages', 'useAdminPages');
            return await AdminApi.getAdminPages();
        },
        select: (data: IAdminPage[]) => {
            // Filter system pages
            const systemPages = data.filter(page => page.is_system === 1);
            
            // Transform system pages into navigation links format
            const systemPageLinks = systemPages.map((page): ISystemPageLink => ({
                label: page.keyword.charAt(0).toUpperCase() + page.keyword.slice(1).replace(/_/g, ' '),
                link: `/admin/pages/${page.keyword}`,
                keyword: page.keyword,
                id: page.id_pages
            }));
            
            // Group system pages by category for better organization
            const authPages = systemPageLinks.filter(page => 
                ['login', 'two-factor-authentication', 'validate', 'reset_password'].includes(page.keyword)
            );
            
            const profilePages = systemPageLinks.filter(page => 
                ['profile', 'home'].includes(page.keyword)
            );
            
            const errorPages = systemPageLinks.filter(page => 
                ['missing', 'no_access', 'no_access_guest'].includes(page.keyword)
            );
            
            const legalPages = systemPageLinks.filter(page => 
                ['agb', 'impressum', 'disclaimer'].includes(page.keyword)
            );
            
            const otherPages = systemPageLinks.filter(page => 
                !authPages.includes(page) && 
                !profilePages.includes(page) && 
                !errorPages.includes(page) && 
                !legalPages.includes(page)
            );
            
            const categorizedSystemPages = {
                authentication: authPages,
                profile: profilePages,
                errors: errorPages,
                legal: legalPages,
                other: otherPages
            };

            debug('Processed admin pages', 'useAdminPages', { 
                totalPages: data.length, 
                systemPages: systemPages.length,
                systemPageKeywords: systemPages.map(p => p.keyword)
            });
            
            return {
                pages: data,
                systemPages,
                systemPageLinks,
                categorizedSystemPages
            };
        },
        staleTime: 1000, // 1 second
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        retry: 1
    });

    return {
        pages: data?.pages || [],
        systemPages: data?.systemPages || [],
        systemPageLinks: data?.systemPageLinks || [],
        categorizedSystemPages: data?.categorizedSystemPages || {
            authentication: [],
            profile: [],
            errors: [],
            legal: [],
            other: []
        },
        isLoading,
        error
    };
}