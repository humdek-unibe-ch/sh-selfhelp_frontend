import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormSubmissionApi } from '../api/frontend/form-submission.api';
import {
    IFormSubmitRequest,
    IFormUpdateRequest
} from '../types/requests/frontend/form-submission.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { notifications } from '@mantine/notifications';

/**
 * Hook to submit a new form (anonymous users)
 */
export function useSubmitFormMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: IFormSubmitRequest) => FormSubmissionApi.submitForm(data),
        onSuccess: (response, variables) => {

            // Invalidate page content so UI pulls latest data
            queryClient.invalidateQueries({ queryKey: ['page-content'] });
            queryClient.invalidateQueries({ queryKey: ['page-content-layout'] });
            queryClient.invalidateQueries({ queryKey: ['frontend-pages'] });
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

            // Invalidate page content so UI pulls latest data
            queryClient.invalidateQueries({ queryKey: ['page-content'] });
            queryClient.invalidateQueries({ queryKey: ['page-content-layout'] });
            queryClient.invalidateQueries({ queryKey: ['frontend-pages'] });
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
            // Invalidate page content so UI pulls latest data
            queryClient.invalidateQueries({ queryKey: ['page-content'] });
            queryClient.invalidateQueries({ queryKey: ['page-content-layout'] });
            queryClient.invalidateQueries({ queryKey: ['frontend-pages'] });
            queryClient.invalidateQueries({ queryKey: ['userInputEntries'] });

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
