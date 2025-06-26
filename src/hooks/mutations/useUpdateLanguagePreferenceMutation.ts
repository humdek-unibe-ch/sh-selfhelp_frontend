/**
 * Custom mutation hook for updating user language preferences.
 * Handles API calls to update user's preferred language and manages JWT token refresh.
 * 
 * @module hooks/mutations/useUpdateLanguagePreferenceMutation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthApi } from '../../api/auth.api';
import { ILoginSuccessResponse } from '../../types/responses/auth.types';
import { notifications } from '@mantine/notifications';
import { debug, info, error } from '../../utils/debug-logger';

/**
 * Hook for updating user's language preference
 * @returns Mutation object with methods and state for language preference updates
 */
export function useUpdateLanguagePreferenceMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (languageId: number): Promise<ILoginSuccessResponse> => {
            debug('Updating user language preference', 'useUpdateLanguagePreferenceMutation', { 
                languageId 
            });
            return AuthApi.updateLanguagePreference(languageId);
        },
        onSuccess: (data, languageId) => {
            info('Language preference updated successfully', 'useUpdateLanguagePreferenceMutation', { 
                newLanguageId: data.data.user?.language_id,
                newLanguageLocale: data.data.user?.language_locale,
                requestedLanguageId: languageId
            });
            
            // Invalidate relevant queries to refresh user data
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['auth'] });
            
            // Show success notification
            notifications.show({
                title: 'Language Updated',
                message: 'Your language preference has been saved.',
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