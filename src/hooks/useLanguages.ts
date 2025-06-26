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
import { useAuth } from './useAuth';
import { getAccessToken } from '../utils/auth.utils';
import { debug } from '../utils/debug-logger';

/**
 * Hook for fetching and managing languages data
 * @returns Object containing languages data and query state
 */
export function useLanguages() {
    const { isAuthenticated, user } = useAuth();
    
    // More robust authentication check: must have Refine auth state, user data, AND access token
    const isActuallyAuthenticated = !!isAuthenticated && !!user && !!getAccessToken();
    
    const { data, isLoading, error } = useQuery({
        queryKey: ['languages'],
        queryFn: async () => {
            debug('Fetching languages', 'useLanguages');
            return await AdminApi.getLanguages();
        },
        enabled: isActuallyAuthenticated, // Only fetch when user is truly authenticated
        select: (data: ILanguage[]) => {
            // Transform locale codes for easier use in the UI
            return data.map(lang => ({
                ...lang,
                // Extract language code from locale (e.g., 'de-CH' -> 'de', 'en-GB' -> 'en')
                code: lang.locale.split('-')[0]
            }));
        },
        staleTime: 24 * 60 * 60 * 1000, // 1 day in milliseconds
        gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 1 day
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Don't refetch on mount since we cache for 1 day
        retry: 2
    });

    return {
        languages: data || [],
        isLoading,
        error
    };
} 