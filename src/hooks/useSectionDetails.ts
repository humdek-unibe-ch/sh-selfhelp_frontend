import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '../api/admin.api';
import { ISectionDetailsData } from '../types/responses/admin/admin.types';
import { debug } from '../utils/debug-logger';

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
    
    // Debug logging
    debug('useSectionDetails hook called', 'useSectionDetails', {
        keyword,
        sectionId,
        enabled,
        keywordCheck: keyword !== null && keyword !== undefined && keyword !== '',
        sectionIdCheck: sectionId !== null && sectionId !== undefined && !isNaN(sectionId),
        finalEnabled: isEnabled,
        queryKey,
        shouldExecute: isEnabled
    });

    return useQuery<ISectionDetailsData>({
        queryKey,
        queryFn: async () => {
            debug('useSectionDetails queryFn executing', 'useSectionDetails', {
                keyword,
                sectionId
            });
            
            if (!keyword || !sectionId) {
                const error = `Missing required parameters: keyword=${keyword}, sectionId=${sectionId}`;
                debug('useSectionDetails queryFn validation failed', 'useSectionDetails', { error });
                throw new Error(error);
            }
            
            try {
                const result = await AdminApi.getSectionDetails(keyword, sectionId);
                debug('useSectionDetails queryFn success', 'useSectionDetails', {
                    keyword,
                    sectionId,
                    hasData: !!result,
                    sectionName: result?.section?.name
                });
                return result;
            } catch (error) {
                debug('useSectionDetails queryFn error', 'useSectionDetails', {
                    keyword,
                    sectionId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                throw error;
            }
        },
        enabled: isEnabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
} 