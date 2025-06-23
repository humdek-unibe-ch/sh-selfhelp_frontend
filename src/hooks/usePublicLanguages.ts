/**
 * Custom hook for managing public languages data for non-authenticated users.
 * Provides functionality to fetch and cache available languages from the public API
 * with 1-day caching for optimal performance.
 * 
 * @module hooks/usePublicLanguages
 */

import { useQuery } from '@tanstack/react-query';
import { PageApi } from '../api/page.api';
import { ILanguage } from '../types/responses/admin/languages.types';
import { debug } from '../utils/debug-logger';

/**
 * Hook for fetching and managing public languages data
 * @returns Object containing languages data and query state
 */
export function usePublicLanguages() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['public-languages'],
        queryFn: async () => {
            debug('Fetching public languages', 'usePublicLanguages');
            return await PageApi.getPublicLanguages();
        },
        select: (data: ILanguage[]) => {
            // Transform data for easier use in the UI
            return data;
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
        error,
        defaultLanguage: data?.[0] || null // First language as default
    };
} 