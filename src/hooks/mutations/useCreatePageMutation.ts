/**
 * React Query mutation hook for creating pages.
 * Provides optimistic updates, error handling, and cache invalidation.
 * 
 * @module hooks/mutations/useCreatePageMutation
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminApi } from '../../api/admin.api';
import { ICreatePageRequest } from '../../types/requests/admin/create-page.types';
import { IAdminPage } from '../../types/responses/admin/admin.types';
import { debug } from '../../utils/debug-logger';
import { parseApiError } from '../../utils/mutation-error-handler';

interface ICreatePageMutationOptions {
    onSuccess?: (data: IAdminPage) => void;
    onError?: (error: any) => void;
    showNotifications?: boolean;
}

/**
 * React Query mutation hook for creating pages
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useCreatePageMutation(options: ICreatePageMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: (pageData: ICreatePageRequest) => AdminApi.createPage(pageData),
        
        onSuccess: async (createdPage: IAdminPage) => {
            debug('Page created successfully', 'useCreatePageMutation', createdPage);
            
            // Invalidate and refetch relevant queries to update the UI
            await Promise.all([
                // Invalidate admin pages list
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
                // Invalidate navigation pages (for frontend navigation)
                queryClient.invalidateQueries({ queryKey: ['pages'] }),
            ]);
            
            if (showNotifications) {
                notifications.show({
                    title: 'Page Created Successfully',
                    message: `Page "${createdPage.keyword}" was created successfully and the page list has been updated!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }
            
            // Call custom success handler if provided
            onSuccess?.(createdPage);
        },
        
        onError: (error: any) => {
            debug('Error creating page', 'useCreatePageMutation', { error });
            
            // Use centralized error parsing
            const { errorMessage, errorTitle } = parseApiError(error);
            
            if (showNotifications) {
                notifications.show({
                    title: errorTitle,
                    message: errorMessage,
                    icon: React.createElement(IconX, { size: '1rem' }),
                    color: 'red',
                    autoClose: 8000,
                    position: 'top-center',
                });
            }
            
            // Call custom error handler if provided
            onError?.(error);
        },
    });
} 