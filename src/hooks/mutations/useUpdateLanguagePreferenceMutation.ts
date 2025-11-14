/**
 * Custom mutation hook for updating user language preferences.
 * Handles API calls to update user's preferred language and manages JWT token refresh.
 * 
 * @module hooks/mutations/useUpdateLanguagePreferenceMutation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthApi } from '../../api/auth.api';
import { ILanguagePreferenceUpdateResponse } from '../../types/responses/auth.types';
import { notifications } from '@mantine/notifications';
import { error } from '../../utils/debug-logger';

/**
 * Hook for updating user's language preference
 * @returns Mutation object with methods and state for language preference updates
 */
export function useUpdateLanguagePreferenceMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (languageId: number): Promise<ILanguagePreferenceUpdateResponse> => {
            return AuthApi.updateLanguagePreference(languageId);
        },
        onSuccess: async (data, languageId) => {
            
            // Wait a bit for localStorage to be updated
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Invalidate identity query to ensure useAuth gets updated user data
            await queryClient.invalidateQueries({ queryKey: ['get_identity'] });
            
            // Invalidate all queries to refresh with new language
            await queryClient.invalidateQueries({ queryKey: ['page-content'] });
            await queryClient.invalidateQueries({ queryKey: ['frontend-pages'] });
            
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