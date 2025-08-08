import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormSubmissionApi } from '../api/frontend/form-submission.api';
import {
    IFormSubmitRequest,
    IFormUpdateRequest
} from '../types/requests/frontend/form-submission.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { notifications } from '@mantine/notifications';
import { debug } from '../utils/debug-logger';

/**
 * Hook to submit a new form (anonymous users)
 */
export function useSubmitFormMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: IFormSubmitRequest) => FormSubmissionApi.submitForm(data),
        onSuccess: (response, variables) => {
            debug('Form submitted successfully', 'useSubmitFormMutation', {
                pageId: variables.page_id,
                formId: variables.section_id,
                recordId: response.data?.record_id
            });

            queryClient.invalidateQueries({ queryKey: ['userInputEntries'] });

            // Show success notification if not handled by component
            if (response.data?.success && response.data?.message) {
                notifications.show({
                    title: 'Form Submitted',
                    message: response.data.message,
                    color: 'green',
                });
            }
        },
        onError: (error, variables) => {
            debug('Failed to submit form', 'useSubmitFormMutation', {
                pageId: variables.page_id,
                formId: variables.section_id,
                error
            });

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
        mutationFn: (data: IFormUpdateRequest) => FormSubmissionApi.updateForm(data),
        onSuccess: (response, variables) => {
            debug('Form updated successfully', 'useUpdateFormMutation', {
                pageId: variables.page_id,
                formId: variables.section_id,
                recordId: response.data?.record_id,
                updatedFields: response.data?.updated_fields
            });

            queryClient.invalidateQueries({ queryKey: ['userInputEntries'] });

            // Show success notification if not handled by component
            if (response.data?.success && response.data?.message) {
                notifications.show({
                    title: 'Form Updated',
                    message: response.data.message,
                    color: 'blue',
                });
            }
        },
        onError: (error, variables) => {
            debug('Failed to update form', 'useUpdateFormMutation', {
                pageId: variables.page_id,
                formId: variables.section_id,
                error
            });

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
            debug('Form record deleted successfully', 'useDeleteFormMutation', {
                recordId: variables.record_id,
                pageId: variables.page_id,
                formId: variables.section_id,
                success: response.data?.success
            });

            queryClient.invalidateQueries({ queryKey: ['userInputEntries'] });

            notifications.show({
                title: 'Record Deleted',
                message: `Form record ${variables.record_id} has been deleted successfully`,
                color: 'green',
            });
        },
        onError: (error, variables) => {
            debug('Failed to delete form record', 'useDeleteFormMutation', {
                recordId: variables.record_id,
                pageId: variables.page_id,
                formId: variables.section_id,
                error
            });

            notifications.show({
                title: 'Deletion Failed',
                message: `Failed to delete record ${variables.record_id}`,
                color: 'red',
            });
        },
    });
}
