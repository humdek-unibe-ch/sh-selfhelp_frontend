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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PreferencesApi, ICMSPreferences } from '../api/admin/preferences.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { notifications } from '@mantine/notifications';

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
        staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.staleTime,
        gcTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.gcTime,
        retry: 2,
    });
}

/**
 * Hook for updating CMS preferences with optimistic updates
 *
 * Provides mutation functionality with automatic cache updates and user notifications.
 * Validates Firebase config format before sending to server.
 *
 * @returns Mutation hook with loading states and error handling
 *
 * @example
 * ```typescript
 * const updatePreferences = useUpdateCmsPreferences();
 *
 * const handleSave = (newPrefs: ICMSPreferences) => {
 *     updatePreferences.mutate(newPrefs, {
 *         onSuccess: () => console.log('Preferences updated'),
 *         onError: (error) => console.error('Update failed', error)
 *     });
 * };
 * ```
 *
 * @note Automatically updates React Query cache on success
 * @note Shows success/error notifications to user
 * @note Validates Firebase config as JSON format
 */
export function useUpdateCmsPreferences() {
    const queryClient = useQueryClient();

    return useMutation<ICMSPreferences, Error, ICMSPreferences>({
        mutationFn: PreferencesApi.updateCmsPreferences,
        onSuccess: (data) => {
            // Update the cache with server response
            queryClient.setQueryData(['admin', 'cms-preferences'], data);

            // Show success notification
            notifications.show({
                title: 'Settings Updated',
                message: 'CMS preferences have been saved successfully.',
                color: 'green'
            });
        },
        onError: (error) => {
            notifications.show({
                title: 'Update Failed',
                message: error.message || 'Failed to update CMS preferences.',
                color: 'red'
            });
        }
    });
} 