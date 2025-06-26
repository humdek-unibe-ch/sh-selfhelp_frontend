/**
 * Custom mutation hook for updating user language preferences.
 * Handles API calls to update user's preferred language and manages JWT token refresh.
 * 
 * @module hooks/mutations/useUpdateLanguagePreferenceMutation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useInvalidate } from '@refinedev/core';
import { AuthApi } from '../../api/auth.api';
import { ILanguagePreferenceUpdateResponse } from '../../types/responses/auth.types';
import { notifications } from '@mantine/notifications';
import { debug, info, error } from '../../utils/debug-logger';

/**
 * Hook for updating user's language preference
 * @returns Mutation object with methods and state for language preference updates
 */
export function useUpdateLanguagePreferenceMutation() {
    const queryClient = useQueryClient();
    const invalidate = useInvalidate();

    return useMutation({
        mutationFn: (languageId: number): Promise<ILanguagePreferenceUpdateResponse> => {
            debug('Updating user language preference', 'useUpdateLanguagePreferenceMutation', { 
                languageId 
            });
            return AuthApi.updateLanguagePreference(languageId);
        },
        onSuccess: (data, languageId) => {
            info('Language preference updated successfully', 'useUpdateLanguagePreferenceMutation', { 
                newLanguageId: data.data.language_id,
                newLanguageLocale: data.data.language_locale,
                newLanguageName: data.data.language_name,
                requestedLanguageId: languageId
            });
            
            // Invalidate all queries to ensure fresh data with new language
            queryClient.invalidateQueries();
            
            // Force refetch of user identity in Refine
            queryClient.refetchQueries({
                predicate: (query) => {
                    // Target Refine's internal auth queries
                    const queryKey = query.queryKey;
                    return Array.isArray(queryKey) && (
                        queryKey.includes('useIsAuthenticated') ||
                        queryKey.includes('useGetIdentity') ||
                        queryKey.includes('auth') ||
                        queryKey.includes('identity')
                    );
                }
            });
            
            // Show success notification
            notifications.show({
                title: 'Language Updated',
                message: `Language changed to ${data.data.language_name}`,
                color: 'green'
            });
        },
        onError: (err: any, languageId) => {
            error('Failed to update language preference', 'useUpdateLanguagePreferenceMutation', {
                error: err,
                requestedLanguageId: languageId
            });
            
            // Show error notification
            notifications.show({
                title: 'Language Update Failed',
                message: 'Could not save your language preference. Please try again.',
                color: 'red'
            });
        }
    });
} 