/**
 * Hook for detecting unpublished changes
 * Uses fast hash-based comparison from backend
 */

import { useQuery } from '@tanstack/react-query';
import { PageVersionApi } from '../api/admin/page-version.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { IUnpublishedChangesResponse } from '../types/responses/admin/page-version.types';

export function useUnpublishedChanges(pageId: number | null) {
    return useQuery<IUnpublishedChangesResponse>({
        queryKey: ['unpublished-changes', pageId],
        queryFn: () => PageVersionApi.hasUnpublishedChanges(pageId!),
        enabled: !!pageId,
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        // Optionally poll for changes every 30 seconds
        refetchInterval: 30000,
    });
}

