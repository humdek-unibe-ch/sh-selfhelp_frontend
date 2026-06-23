/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormSubmissionApi } from '../api/frontend/form-submission.api';
import {
    type IFormSubmitRequest,
    type IFormUpdateRequest
} from '../shared';
import { notifications } from '@mantine/notifications';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

/**
 * Hook to submit a new form (anonymous users).
 *
 * We invalidate `['user-data']` so the user-data query refetches; if the form
 * grant changed the user's ACL, `acl_version` will differ and the global
 * useAclVersionWatcher hook invalidates `['frontend-pages']`. No unconditional
 * nav refresh here.
 */
export function useSubmitFormMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: IFormSubmitRequest | FormData) => FormSubmissionApi.submitForm(data),
        // Success feedback (redirect / inline confirmation) is owned by the
        // FormUserInput renderer. The backend submit response carries no
        // `success`/`message` fields, so there is no toast to show here — we
        // only refresh the caches the submission may have changed.
        onSuccess: async () => {
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL });
            void queryClient.invalidateQueries({ queryKey: ['userInputEntries'] });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });
        },
        onError: (_error, _variables) => {

            notifications.show({
                title: 'Submission Failed',
                message: 'Failed to submit form. Please try again.',
                color: 'red',
            });
        },
    });
}

/**
 * Hook to update an existing form (authenticated users)
 */
export function useUpdateFormMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: IFormUpdateRequest | FormData) => FormSubmissionApi.updateForm(data),
        // As with submit: the backend update response carries no
        // `success`/`message` fields, so there is no toast to show here — only
        // refresh the caches the update may have changed.
        onSuccess: async () => {
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL });
            void queryClient.invalidateQueries({ queryKey: ['userInputEntries'] });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });
        },
        onError: (_error, _variables) => {

            notifications.show({
                title: 'Update Failed',
                message: 'Failed to update form. Please try again.',
                color: 'red',
            });
        },
    });
}

/**
 * Hook to delete a form record
 */
export function useDeleteFormMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { record_id: number; page_id: number; section_id: number }) =>
            FormSubmissionApi.deleteForm(data),
        onSuccess: (response, variables) => {
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL });
            void queryClient.invalidateQueries({ queryKey: ['userInputEntries'] });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });

            notifications.show({
                title: 'Record Deleted',
                message: `Form record ${variables.record_id} has been deleted successfully`,
                color: 'green',
            });
        },
        onError: (_error, variables) => {

            notifications.show({
                title: 'Deletion Failed',
                message: `Failed to delete record ${variables.record_id}`,
                color: 'red',
            });
        },
    });
}
