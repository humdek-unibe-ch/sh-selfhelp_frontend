/**
 * Custom hook for managing languages data.
 * Provides functionality to fetch and cache available languages from the API
 * with optimized caching. Supports both authenticated and public access.
 *
 * @module hooks/useLanguages
 */

import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '../api/admin.api';
import { apiClient } from '../api/base.api';
import { API_CONFIG } from '../config/api.config';
import { IBaseApiResponse } from '../types/responses/common/response-envelope.types';
import { ILanguage } from '../types/responses/admin/languages.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useAuth } from './useAuth';
import { getAccessToken } from '../utils/auth.utils';

interface IUseLanguagesOptions {
  /** Force public access even if authenticated */
  publicOnly?: boolean;
  /** Force admin access (requires authentication) */
  adminOnly?: boolean;
}

/**
 * Hook for fetching languages data with auth-aware endpoint selection
 * @param options Configuration options for language fetching
 * @returns Object containing languages data and query state
 */
export function useLanguages(options: IUseLanguagesOptions = {}) {
    const { publicOnly = false, adminOnly = false } = options;
    const { isAuthenticated, user } = useAuth();

    // Determine if we should use authenticated endpoints
    const shouldUseAdmin = !publicOnly && (adminOnly || (isAuthenticated && user && getAccessToken()));

    const { data, isLoading, error } = useQuery({
        queryKey: shouldUseAdmin
            ? REACT_QUERY_CONFIG.QUERY_KEYS.LANGUAGES
            : REACT_QUERY_CONFIG.QUERY_KEYS.PUBLIC_LANGUAGES,
        queryFn: async (): Promise<ILanguage[]> => {
            if (shouldUseAdmin) {
                return await AdminApi.getLanguages();
            } else {
                // Use direct API call for public languages (same as original usePublicLanguages)
                const response = await apiClient.get<IBaseApiResponse<ILanguage[]>>(API_CONFIG.ENDPOINTS.LANGUAGES);
                return response.data.data;
            }
        },
        enabled: !adminOnly || shouldUseAdmin, // Only fetch admin if user is authenticated
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        select: (data: ILanguage[]) => {
            return data;
        }
    });

    return {
        languages: data || [],
        isLoading,
        error,
        isUsingAdminEndpoint: shouldUseAdmin
    };
}

/**
 * Legacy hook for fetching admin languages (requires authentication)
 * @deprecated Use useLanguages({ adminOnly: true }) instead
 * @returns Object containing languages data and query state
 */
export function useLanguagesAdmin() {
    return useLanguages({ adminOnly: true });
}

/**
 * Legacy hook for fetching public languages (no authentication required)
 * @deprecated Use useLanguages({ publicOnly: true }) instead
 * @returns Object containing languages data and query state
 */
export function usePublicLanguages() {
    const result = useLanguages({ publicOnly: true });
    return {
        languages: result.languages,
        isLoading: result.isLoading,
        error: result.error,
        defaultLanguage: result.languages[0] || null // First language as default
    };
} 