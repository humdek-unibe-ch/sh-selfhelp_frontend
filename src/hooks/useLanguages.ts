/**
 * Custom hook for managing languages data.
 * Provides functionality to fetch and cache available languages from the API
 * with optimized caching. Supports both authenticated and public access.
 *
 * @module hooks/useLanguages
 */

import { useQuery } from '@tanstack/react-query';
import { permissionAwareApiClient } from '../api/base.api';
import { API_CONFIG } from '../config/api.config';
import { IBaseApiResponse } from '../types/responses/common/response-envelope.types';
import { ILanguage } from '../types/responses/admin/languages.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useAuth } from './useAuth';    
import { getAccessToken } from '../utils/auth.utils';
import { AdminApi } from '../api/admin';


/**
 * Hook for fetching admin languages from /admin/languages endpoint
 * Requires authentication and admin permissions
 * @returns Object containing admin languages data and query state
 */
export function useAdminLanguages() {
    const { isAuthenticated } = useAuth();

    const { data, isLoading, error } = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.LANGUAGES,
        queryFn: async (): Promise<ILanguage[]> => {
            return await AdminApi.getLanguages();
        },
        enabled: !!isAuthenticated && !!getAccessToken(),
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
    });

    return {
        languages: data || [],
        isLoading,
        error,
    };
}

/**
 * Hook for fetching public languages from /languages endpoint
 * No authentication required
 * @returns Object containing public languages data and query state
 */
export function usePublicLanguages() {
    const { data, isLoading, error } = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PUBLIC_LANGUAGES,
        queryFn: async (): Promise<ILanguage[]> => {
            const response = await permissionAwareApiClient.get<IBaseApiResponse<ILanguage[]>>(API_CONFIG.ENDPOINTS.LANGUAGES);
            return response.data.data;
        },
        enabled: true, // Always enabled for public languages
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
    });

    return {
        languages: data || [],
        isLoading,
        error,
        defaultLanguage: data?.[0] || null // First language as default
    };
}

 