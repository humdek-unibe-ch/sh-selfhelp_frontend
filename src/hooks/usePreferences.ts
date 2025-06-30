/**
 * React Query hook for managing CMS preferences
 * Provides functionality to fetch and update system preferences
 * 
 * @module hooks/usePreferences
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PreferencesApi, ICMSPreferences } from '../api/admin/preferences.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { notifications } from '@mantine/notifications';

/**
 * Hook for fetching CMS preferences
 * @returns React Query result with preferences data
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
 * Hook for updating CMS preferences
 * @returns Mutation hook for updating CMS preferences
 */
export function useUpdateCmsPreferences() {
    const queryClient = useQueryClient();

    return useMutation<ICMSPreferences, Error, ICMSPreferences>({
        mutationFn: PreferencesApi.updateCmsPreferences,
        onSuccess: (data) => {
            // Update the cache
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