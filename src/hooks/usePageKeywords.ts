import { useQuery } from '@tanstack/react-query';
import { AdminPageKeywordsApi, type IPageKeyword } from '../api/admin/page-keywords.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

/**
 * Hook to fetch all page keywords
 */
export function usePageKeywords() {
  return useQuery<IPageKeyword[]>({
    queryKey: ['page-keywords'],
    queryFn: () => AdminPageKeywordsApi.getPageKeywords(),
    staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    refetchOnWindowFocus: false,
  });
}
