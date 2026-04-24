/**
 * Mutation hook for updating the authenticated user's language preference.
 *
 * The BFF's `/auth/set-language` endpoint returns a rotated access token in
 * the response body; the catch-all proxy scrubs the token out and sets the
 * new `sh_auth` cookie automatically. No client-side token handling is
 * needed here.
 *
 * Cache invalidation is split across two owners to avoid duplicate refetches:
 *  - `setCurrentLanguageId` (LanguageContext) invalidates the two page caches
 *    `['frontend-pages']` + `['page-by-keyword']` — it already runs on every
 *    language change, authenticated or not.
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
