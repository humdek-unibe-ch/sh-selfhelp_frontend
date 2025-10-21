/**
 * Page Versions Hook
 * React Query hook for fetching page versions
 */

import { useQuery } from '@tanstack/react-query';
import { PageVersionApi } from '../api/admin/page-version.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { IVersionListParams } from '../types/requests/admin/page-version.types';

export function usePageVersions(pageId: number | null, params?: IVersionListParams) {
    return useQuery({
        queryKey: ['page-versions', pageId, params],
        queryFn: () => PageVersionApi.listVersions(pageId!, params),
        enabled: !!pageId,
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
    });
}

export function usePageVersion(pageId: number | null, versionId: number | null, includePageJson: boolean = false) {
    return useQuery({
        queryKey: ['page-version', pageId, versionId, includePageJson],
        queryFn: () => PageVersionApi.getVersion(pageId!, versionId!, { include_page_json: includePageJson }),
        enabled: !!pageId && !!versionId,
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
    });
}

export function useVersionComparison(
    pageId: number | null,
    version1Id: number | null,
    version2Id: number | null,
    format: 'unified' | 'side_by_side' | 'json_patch' | 'summary' = 'side_by_side'
) {
    return useQuery({
        queryKey: ['version-comparison', pageId, version1Id, version2Id, format],
        queryFn: () => PageVersionApi.compareVersions(pageId!, version1Id!, version2Id!, { format }),
        enabled: !!pageId && !!version1Id && !!version2Id,
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
    });
}

