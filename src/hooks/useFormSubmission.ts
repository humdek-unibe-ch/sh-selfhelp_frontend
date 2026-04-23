import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormSubmissionApi } from '../api/frontend/form-submission.api';
import {
    IFormSubmitRequest,
    IFormUpdateRequest
} from '../types/requests/frontend/form-submission.types';
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
        onSuccess: async (response, variables) => {

            queryClient.invalidateQueries({ queryKey: ['page-by-keyword'] });
            queryClient.invalidateQueries({ queryKey: ['userInputEntries'] });
            queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });

            if (response.data?.success && response.data?.message) {
                notifications.show({
                    title: 'Form Submitted',
                    message: response.data.message,
                    color: 'green',
                });
            }
        },
        onError: (error, variables) => {

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
        onSuccess: async (response, variables) => {

            queryClient.invalidateQueries({ queryKey: ['page-by-keyword'] });
            queryClient.invalidateQueries({ queryKey: ['userInputEntries'] });
            queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });

            if (response.data?.success && response.data?.message) {
                notifications.show({
                    title: 'Form Updated',
                    message: response.data.message,
                    color: 'blue',
                });
            }
        },
        onError: (error, variables) => {

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
            queryClient.invalidateQueries({ queryKey: ['page-by-keyword'] });
            queryClient.invalidateQueries({ queryKey: ['userInputEntries'] });
            queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });

            notifications.show({
                title: 'Record Deleted',
                message: `Form record ${variables.record_id} has been deleted successfully`,
                color: 'green',
            });
        },
        onError: (error, variables) => {

            notifications.show({
                title: 'Deletion Failed',
                message: `Failed to delete record ${variables.record_id}`,
                color: 'red',
            });
        },
    });
}
