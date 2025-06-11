/**
 * React Query mutation hook for updating pages.
 * Provides error handling, cache invalidation, and success notifications.
 * 
 * @module hooks/mutations/useUpdatePageMutation
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminApi } from '../../api/admin.api';
import { IUpdatePageRequest } from '../../types/requests/admin/update-page.types';
import { IAdminPage } from '../../types/responses/admin/admin.types';
import { debug } from '../../utils/debug-logger';
import { parseApiError } from '../../utils/mutation-error-handler';

interface IUpdatePageMutationOptions {
    onSuccess?: (data: IAdminPage, keyword: string) => void;
    onError?: (error: any, keyword: string) => void;
    showNotifications?: boolean;
}

interface IUpdatePageMutationVariables {
    keyword: string;
    updateData: IUpdatePageRequest;
}

/**
 * React Query mutation hook for updating pages
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useUpdatePageMutation(options: IUpdatePageMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: ({ keyword, updateData }: IUpdatePageMutationVariables) => 
            AdminApi.updatePage(keyword, updateData),
        
        onSuccess: async (updatedPage: IAdminPage, { keyword }: IUpdatePageMutationVariables) => {
            debug('Page updated successfully', 'useUpdatePageMutation', { 
                keyword, 
                updatedPage: updatedPage.keyword 
            });
            
            // Invalidate and refetch relevant queries to update the UI
            await Promise.all([
                // Invalidate admin pages list
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
                // Invalidate navigation pages (for frontend navigation)
                queryClient.invalidateQueries({ queryKey: ['pages'] }),
                // Invalidate specific page data to refetch updated content
                queryClient.invalidateQueries({ queryKey: ['pageFields', keyword] }),
                queryClient.invalidateQueries({ queryKey: ['pageSections', keyword] }),
            ]);
            
            if (showNotifications) {
                notifications.show({
                    title: 'Page Updated Successfully',
                    message: `Page "${keyword}" has been updated successfully with all changes saved!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }
            
            // Call custom success handler if provided
            onSuccess?.(updatedPage, keyword);
        },
        
        onError: (error: any, { keyword }: IUpdatePageMutationVariables) => {
            debug('Error updating page', 'useUpdatePageMutation', { error, keyword });
            
            // Use centralized error parsing
            const { errorMessage, errorTitle } = parseApiError(error);
            
            if (showNotifications) {
                notifications.show({
                    title: errorTitle || 'Update Failed',
                    message: errorMessage || `Failed to update page "${keyword}". Please try again.`,
                    icon: React.createElement(IconX, { size: '1rem' }),
                    color: 'red',
                    autoClose: 8000,
                    position: 'top-center',
                });
            }
            
            // Call custom error handler if provided
            onError?.(error, keyword);
        },
    });
} 