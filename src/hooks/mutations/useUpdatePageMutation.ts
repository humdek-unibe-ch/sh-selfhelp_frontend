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
import { parseApiError } from '../../utils/mutation-error-handler';

interface IUpdatePageMutationOptions {
    onSuccess?: (data: IAdminPage, pageId: number) => void;
    onError?: (error: any, pageId: number) => void;
    showNotifications?: boolean;
}

interface IUpdatePageMutationVariables {
    pageId: number;
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
        mutationFn: ({ pageId, updateData }: IUpdatePageMutationVariables) => 
            AdminApi.updatePage(pageId, updateData),
        
        onSuccess: async (updatedPage: IAdminPage, { pageId }: IUpdatePageMutationVariables) => {

            // Enhanced cache invalidation strategy with consistent query keys
            await Promise.all([
                // Main admin pages list
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
                // Page-specific data
                queryClient.invalidateQueries({ queryKey: ['pageFields', pageId] }),
                queryClient.invalidateQueries({ queryKey: ['pageSections', pageId] }),
                // Frontend navigation pages
                queryClient.invalidateQueries({ queryKey: ['pages'] }),
                queryClient.invalidateQueries({ queryKey: ['page-content'] }),
                // Frontend pages with language support
                queryClient.invalidateQueries({ queryKey: ['frontend-pages'] }),
                // Force refetch to ensure fresh data
                queryClient.refetchQueries({ queryKey: ['adminPages'] }),
                queryClient.refetchQueries({ queryKey: ['pages'] }),
            ]);
            
            // Clear any stale cached data that might cause duplication
            queryClient.removeQueries({ 
                queryKey: ['adminPages'], 
                exact: false 
            });
            queryClient.removeQueries({ 
                queryKey: ['pages'], 
                exact: false 
            });
            queryClient.removeQueries({ 
                queryKey: ['frontend-pages'], 
                exact: false 
            });
            
            if (showNotifications) {
                notifications.show({
                    title: 'Page Updated Successfully',
                    message: `Page "${pageId}" has been updated successfully with all changes saved!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }
            
            // Call custom success handler if provided
            onSuccess?.(updatedPage, pageId);
        },
        
        onError: (error: any, { pageId }: IUpdatePageMutationVariables) => {
            
            // Use centralized error parsing
            const { errorMessage, errorTitle } = parseApiError(error);
            
            if (showNotifications) {
                notifications.show({
                    title: errorTitle || 'Update Failed',
                    message: errorMessage || `Failed to update page "${pageId}". Please try again.`,
                    icon: React.createElement(IconX, { size: '1rem' }),
                    color: 'red',
                    autoClose: 8000,
                    position: 'top-center',
                });
            }
            
            // Call custom error handler if provided
            onError?.(error, pageId);
        },
    });
} 