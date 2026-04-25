/**
 * Mutation hook for updating the authenticated user's language preference.
 *
 * The BFF's `/auth/set-language` endpoint persists the user's preferred
 * language; it does not rotate JWTs and does not change `acl_version`, so no
 * cookie or permission handling is needed here.
 *
 * Cache responsibilities are minimal and deliberately scoped:
 *  - `setCurrentLanguageId` (LanguageContext) writes the cookie and updates
 *    the in-memory language id. The language-scoped query keys
 *    (`['frontend-pages', languageId]`, `['page-by-keyword', kw, languageId,
 *    …]`) include the id, so a state change alone routes consumers to the
 *    correct cache entry — no manual invalidation is needed.
 *  - This mutation is only responsible for the authenticated-user-only
 *    `['user-data']` key (the profile envelope carries `language.id` /
 *    `language.locale`, which needs to reflect the new preference).
 *
 * @module hooks/mutations/useUpdateLanguagePreferenceMutation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthApi } from '../../api/auth.api';
import { ILanguagePreferenceUpdateResponse } from '../../types/responses/auth.types';
import { notifications } from '@mantine/notifications';
import { error } from '../../utils/debug-logger';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';

export function useUpdateLanguagePreferenceMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (languageId: number): Promise<ILanguagePreferenceUpdateResponse> => {
            return AuthApi.updateLanguagePreference(languageId);
        },
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({
                queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA,
            });

            notifications.show({
                title: 'Language Updated',
                message: `Language changed to ${data.data.language_name}`,
                color: 'green',
            });
        },
        onError: (err: any, languageId) => {
            error('Failed to update language preference', 'useUpdateLanguagePreferenceMutation', {
                error: err,
                requestedLanguageId: languageId,
            });

            notifications.show({
                title: 'Language Update Failed',
                message: 'Could not save your language preference. Please try again.',
                color: 'red',
            });
        },
    });
}
