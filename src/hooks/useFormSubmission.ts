/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormSubmissionApi } from '../api/frontend/form-submission.api';
import {
    getFormInvalidData,
    getFormStaleVersion,
    type IFormDeleteRequest,
    type IFormSubmitRequest,
    type IFormUpdateRequest
} from '../shared';
import { notifications } from '@mantine/notifications';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { usePreviewMode } from '../app/components/contexts/PreviewModeContext';
import { withPreview, withPreviewFormData } from '../utils/form-write.utils';

/** A write body, as a form sends it: JSON, or multipart when files travel with it. */
function withPreviewBody<T extends object>(data: T | FormData, preview: boolean): T | FormData {
    return data instanceof FormData ? withPreviewFormData(data, preview) : withPreview(data, preview);
}

interface IFormMutationOptions {
    /**
     * Refresh the cached page payload after the write (default true). An
     * `entry-form-list` passes false: it reads its own state again and the
     * rest of the page did not change.
     */
    refreshPageContent?: boolean;
}

/**
 * Hook to submit a new form (anonymous users).
 *
 * We invalidate `['user-data']` so the user-data query refetches; if the form
 * grant changed the user's ACL, `acl_version` will differ and the global
 * useAclVersionWatcher hook invalidates `['frontend-pages']`. No unconditional
 * nav refresh here.
 */
export function useSubmitFormMutation({ refreshPageContent = true }: IFormMutationOptions = {}) {
    const queryClient = useQueryClient();
    // The write acts on the page version the person looks at (the draft only in preview mode).
    const { isPreviewMode } = usePreviewMode();

    return useMutation({
        mutationFn: (data: IFormSubmitRequest | FormData) =>
            FormSubmissionApi.submitForm(withPreviewBody(data, isPreviewMode)),
        // Success feedback (redirect / inline confirmation) is owned by the
        // FormUserInput renderer. The backend submit response carries no
        // `success`/`message` fields, so there is no toast to show here — we
        // only refresh the caches the submission may have changed.
        onSuccess: async () => {
            if (refreshPageContent) {
                void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL });
            }
            void queryClient.invalidateQueries({ queryKey: ['userInputEntries'] });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });
            // A new record may belong to any list of this table.
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FORM_LIST_ALL });
        },
        onError: (error, _variables) => {
            // A value that breaks the rules of the form is told as such: the person fixes the input
            // and sends again (the message names the field; nothing was stored).
            const invalid = getFormInvalidData(error);
            notifications.show({
                title: invalid !== null ? 'Check your input' : 'Submission Failed',
                message: invalid !== null
                    ? invalid.errors.map((entry) => entry.message).join(' ')
                    : 'Failed to submit form. Please try again.',
                color: 'red',
            });
        },
    });
}

/**
 * Hook to update an existing form (authenticated users)
 */
export function useUpdateFormMutation({ refreshPageContent = true }: IFormMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { isPreviewMode } = usePreviewMode();

    return useMutation({
        mutationFn: (data: IFormUpdateRequest | FormData) =>
            FormSubmissionApi.updateForm(withPreviewBody(data, isPreviewMode)),
        // As with submit: the backend update response carries no
        // `success`/`message` fields, so there is no toast to show here — only
        // refresh the caches the update may have changed.
        onSuccess: async () => {
            if (refreshPageContent) {
                void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL });
            }
            void queryClient.invalidateQueries({ queryKey: ['userInputEntries'] });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FORM_LIST_ALL });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FORM_LIST_HISTORY_ALL });
        },
        onError: (error, _variables) => {
            // A stale save (409 `stale_version`) is not a failure to retry: the
            // caller keeps the draft and offers reload / compare / re-apply.
            if (getFormStaleVersion(error) !== null) {
                return;
            }

            const invalid = getFormInvalidData(error);
            notifications.show({
                title: invalid !== null ? 'Check your input' : 'Update Failed',
                message: invalid !== null
                    ? invalid.errors.map((entry) => entry.message).join(' ')
                    : 'Failed to update form. Please try again.',
                color: 'red',
            });
        },
    });
}

/**
 * Hook to delete a form record. The request names the version of the record the person saw
 * (`expected_version`): the server refuses a delete without it, and one based on an old version
 * answers 409 and keeps the record.
 */
export function useDeleteFormMutation() {
    const queryClient = useQueryClient();
    const { isPreviewMode } = usePreviewMode();

    return useMutation({
        mutationFn: (data: IFormDeleteRequest) =>
            FormSubmissionApi.deleteForm(withPreview(data, isPreviewMode)),
        onSuccess: (response, variables) => {
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL });
            void queryClient.invalidateQueries({ queryKey: ['userInputEntries'] });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FORM_LIST_ALL });

            notifications.show({
                title: 'Record Deleted',
                message: `Form record ${variables.record_id} has been deleted successfully`,
                color: 'green',
            });
        },
        onError: (error, variables) => {
            // Somebody changed the record since the page was read: nothing was deleted. Read the page
            // again so the next attempt starts from the version that is current now, and say why.
            if (getFormStaleVersion(error) !== null) {
                void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL });
                notifications.show({
                    title: 'Record changed',
                    message: `Record ${variables.record_id} was changed by someone else, so it was not deleted. The page shows its current state: check it and delete again if you still want to.`,
                    color: 'yellow',
                });
                return;
            }

            notifications.show({
                title: 'Deletion Failed',
                message: `Failed to delete record ${variables.record_id}`,
                color: 'red',
            });
        },
    });
}
