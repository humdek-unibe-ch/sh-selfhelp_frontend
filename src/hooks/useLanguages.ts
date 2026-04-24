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
import { AdminApi } from '../api/admin';

/**
 * A single frozen reference used whenever the query has no data yet.
 *
 * WHY THIS MATTERS: if we return `data || []` from a hook, every render
 * produces a *new* `[]` reference while `data` is still `undefined`. Any
 * consumer that depends on `languages` via `useEffect` / `useMemo` will
 * then see a changed dependency on every render and loop — we hit exactly
 * this in `LanguageTabsWrapper` (infinite `setState` in an effect depending
 * on `languages`). A frozen, module-level empty array keeps the reference
 * stable across renders.
 */
const EMPTY_LANGUAGES: readonly ILanguage[] = Object.freeze([]) as readonly ILanguage[];


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
        enabled: !!isAuthenticated,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.LANGUAGES.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.LANGUAGES.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
    });

    return {
        languages: (data ?? EMPTY_LANGUAGES) as ILanguage[],
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
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PUBLIC_LANGUAGES,
        queryFn: async (): Promise<ILanguage[]> => {
            const response = await permissionAwareApiClient.get<IBaseApiResponse<ILanguage[]>>(API_CONFIG.ENDPOINTS.LANGUAGES);
            return response.data.data;
        },
        enabled: true,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.LANGUAGES.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.LANGUAGES.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
    });

    return {
        languages: (data ?? EMPTY_LANGUAGES) as ILanguage[],
        isLoading,
        error,
        defaultLanguage: data?.[0] ?? null,
    };
}
