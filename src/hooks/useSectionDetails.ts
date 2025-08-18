import { useQuery } from '@tanstack/react-query';
import { AdminSectionApi } from '../api/admin/section.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { ISectionDetailsData } from '../types/responses/admin/admin.types';

// Query keys
const SECTION_DETAILS_QUERY_KEYS = {
  all: ['section-details'] as const,
  details: () => [...SECTION_DETAILS_QUERY_KEYS.all, 'detail'] as const,
  detail: (keyword: string, sectionId: number) => [...SECTION_DETAILS_QUERY_KEYS.details(), keyword, sectionId] as const,
};

/**
 * Hook for fetching section details by section ID
 * @param keyword - The page keyword
 * @param sectionId - The section ID to fetch details for
 * @param enabled - Whether the query should be enabled
 * @returns React Query result with section details
 */
export function useSectionDetails(keyword: string | null, sectionId: number | null, enabled: boolean = true) {
    const queryKey = ['admin', 'sections', 'details', keyword, sectionId];
    
    // More explicit enabled condition
    const isEnabled = enabled && keyword !== null && keyword !== undefined && keyword !== '' && 
                     sectionId !== null && sectionId !== undefined && !isNaN(sectionId);    

    return useQuery<ISectionDetailsData>({
        queryKey: keyword && sectionId ? SECTION_DETAILS_QUERY_KEYS.detail(keyword, sectionId) : ['section-details', 'disabled'],
        queryFn: async () => {
            
            if (!keyword || !sectionId) {
                const error = `Missing required parameters: keyword=${keyword}, sectionId=${sectionId}`;
                throw new Error(error);
            }
            
            try {
                const result = await AdminSectionApi.getSectionDetails(keyword, sectionId);
                return result;
            } catch (error) {
                throw error;
            }
        },
        enabled: isEnabled,
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
} 