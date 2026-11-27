/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * React Query hooks for managing CMS preferences
 * Provides functionality to fetch and update global system preferences
 *
 * CMS preferences are global settings that affect system behavior:
 * - default_language_id: Fallback language for anonymous users
 * - anonymous_users: Enable public access to pages
 * - firebase_config: Firebase SDK configuration for notifications
 *
 * @module hooks/usePreferences
 */

import { useQuery } from '@tanstack/react-query';
import { PreferencesApi, type ICMSPreferences } from '../api/admin/preferences.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

/**
 * Hook for fetching CMS preferences from the backend
 *
 * Uses static data caching configuration since preferences change infrequently.
 * Automatically handles permission checks and error states.
 *
 * @returns React Query result with preferences data and loading states
 *
 * @example
 * ```typescript
 * const { data: preferences, isLoading, error } = useCmsPreferences();
 *
 * if (isLoading) return <Loader />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return <div>Default language: {preferences?.default_language_id}</div>;
 * ```
 */
export function useCmsPreferences() {
    return useQuery<ICMSPreferences>({
        queryKey: ['admin', 'cms-preferences'],
        queryFn: PreferencesApi.getCmsPreferences,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.STATIC.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.STATIC.gcTime,
        retry: 2,
    });
}
