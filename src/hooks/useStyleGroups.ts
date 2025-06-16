/**
 * React Query hook for fetching style groups.
 * Provides functionality to fetch and transform style groups data from the API.
 * 
 * @module hooks/useStyleGroups
 */

import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '../api/admin.api';
import { IStyleGroup } from '../types/responses/admin/styles.types';
import { debug } from '../utils/debug-logger';

/**
 * Hook to fetch style groups
 * @param enabled - Whether the query should be enabled
 * @returns React Query result with style groups data
 */
export function useStyleGroups(enabled: boolean = true) {
    return useQuery({
        queryKey: ['styleGroups'],
        queryFn: async () => {
            debug('Fetching style groups', 'useStyleGroups');
            const styleGroups = await AdminApi.getStyleGroups();
            return styleGroups;
        },
        enabled,
        select: (data: IStyleGroup[]) => {
            // Sort style groups by position
            return data.sort((a, b) => a.position - b.position);
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });
} 