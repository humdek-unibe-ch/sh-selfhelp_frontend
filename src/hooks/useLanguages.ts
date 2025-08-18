/**
 * Custom hook for managing languages data.
 * Provides functionality to fetch and cache available languages from the API
 * with 1-day caching for optimal performance.
 * 
 * @module hooks/useLanguages
 */

import { useQuery } from '@tanstack/react-query';
import { AdminApi } from '../api/admin.api';
import { ILanguage } from '../types/responses/admin/languages.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useAuth } from './useAuth';
import { getAccessToken } from '../utils/auth.utils';

/**
 * Hook for fetching admin languages (requires authentication)
 * @returns Object containing languages data and query state
 */
export function useLanguages() {
    const { isAuthenticated, user } = useAuth();
    
    // More robust authentication check
    const isActuallyAuthenticated = !!isAuthenticated && !!user && !!getAccessToken();

    const { data, isLoading, error } = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.LANGUAGES,
        queryFn: async () => {
            return await AdminApi.getLanguages();
        },
        enabled: isActuallyAuthenticated, // Only fetch when user is truly authenticated
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
        error
    };
} 