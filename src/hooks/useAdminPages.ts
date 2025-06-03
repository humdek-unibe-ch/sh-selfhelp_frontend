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
            return {
                pages: data,
            };
        },
        staleTime: 1000, // 1 second
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        retry: 1
    });

    return {
        pages: data?.pages || [],
        isLoading,
        error
    };
}