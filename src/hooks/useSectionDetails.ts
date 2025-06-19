import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '../api/admin.api';
import { ISectionDetailsData } from '../types/responses/admin/admin.types';

/**
 * Hook for fetching section details by section ID
 * @param keyword - The page keyword
 * @param sectionId - The section ID to fetch details for
 * @param enabled - Whether the query should be enabled
 * @returns React Query result with section details
 */
export function useSectionDetails(keyword: string | null, sectionId: number | null, enabled: boolean = true) {
    return useQuery<ISectionDetailsData>({
        queryKey: ['admin', 'sections', 'details', keyword, sectionId],
        queryFn: () => {
            if (!keyword || !sectionId) {
                throw new Error('Page keyword and section ID are required');
            }
            return AdminApi.getSectionDetails(keyword, sectionId);
        },
        enabled: enabled && !!keyword && !!sectionId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
} 