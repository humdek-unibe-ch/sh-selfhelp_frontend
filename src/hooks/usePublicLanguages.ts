/**
 * Custom hook for managing public languages data for non-authenticated users.
 * Provides functionality to fetch and cache available languages from the public API
 * with 1-day caching for optimal performance.
 * 
 * @module hooks/usePublicLanguages
 */

import { useQuery } from '@tanstack/react-query';
import { NavigationApi } from '../api/navigation.api';
import { ILanguage } from '../types/responses/admin/languages.types';
import { IBaseApiResponse } from '../types/responses/common/response-envelope.types';
import { apiClient } from '../api/base.api';
import { API_CONFIG } from '../config/api.config';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

/**
 * Hook for fetching and managing public languages data
 * @returns Object containing languages data and query state
 */
export function usePublicLanguages() {
    const { data, isLoading, error } = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PUBLIC_LANGUAGES,
        queryFn: async (): Promise<ILanguage[]> => {
            const response = await apiClient.get<IBaseApiResponse<ILanguage[]>>(API_CONFIG.ENDPOINTS.LANGUAGES);
            return response.data.data;
        },
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        select: (languages: ILanguage[]) => {
            return languages;
        }
    });

    return {
        languages: data || [],
        isLoading,
        error,
        defaultLanguage: data?.[0] || null // First language as default
    };
} 