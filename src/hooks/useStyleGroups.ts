/**
 * React Query hook for fetching style groups.
 * Provides functionality to fetch and transform style groups data from the API.
 * 
 * @module hooks/useStyleGroups
 */

import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '../api/admin.api';
import { IStyleGroup } from '../types/responses/admin/styles.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useAuth } from './useAuth';
import { getAccessToken } from '../utils/auth.utils';
import { debug } from '../utils/debug-logger';

/**
 * Hook for fetching style groups data (requires authentication)
 * Uses longer cache time since style groups are relatively static data
 * @returns Object containing style groups data and query state
 */
export function useStyleGroups() {
    const { isAuthenticated, user } = useAuth();
    
    // More robust authentication check
    const isActuallyAuthenticated = !!isAuthenticated && !!user && !!getAccessToken();

    return useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.STYLE_GROUPS,
        queryFn: async () => {
            debug('Fetching style groups', 'useStyleGroups');
            return await AdminApi.getStyleGroups();
        },
        enabled: isActuallyAuthenticated, // Only fetch when user is truly authenticated
        staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.staleTime, // Use longer cache for static data
        gcTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        select: (data: IStyleGroup[]) => {
            debug('Style groups loaded', 'useStyleGroups', { count: data.length });
            return data;
        }
    });
} 