import { useQuery } from '@tanstack/react-query';
import { AdminGenderApi, type IGendersListResponse } from '../api/admin/gender.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

/**
 * Hook to fetch all genders
 */
export function useGenders() {
  return useQuery<IGendersListResponse>({
    queryKey: ['genders'],
    queryFn: () => AdminGenderApi.getGenders(),
    staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.staleTime,
    refetchOnWindowFocus: false,
  });
} 