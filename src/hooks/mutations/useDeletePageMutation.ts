/**
 * React Query mutation hook for deleting pages.
 * Provides error handling, cache invalidation, and success notifications.
 * 
 * @module hooks/mutations/useDeletePageMutation
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { parseApiError } from '../../utils/mutation-error-handler';
import { useAdminPages } from '../useAdminPages';
import { AdminApi } from '../../api/admin';

interface IDeletePageMutationOptions {
    onSuccess?: (pageId: number) => void;
    onError?: (error: any) => void;
    showNotifications?: boolean;
}

/**
 * React Query mutation hook for deleting pages
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useDeletePageMutation(options: IDeletePageMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;
    const { pages } = useAdminPages();

    return useMutation({
        mutationFn: (pageId: number) => {
            // Check if the page is a system page before attempting deletion
            const page = pages.find(p => p.id_pages === pageId);
            if (page?.is_system === 1) {
                throw new Error('System pages cannot be deleted');
            }
            return AdminApi.deletePage(pageId);
        },
        
        onSuccess: async (result, pageId: number) => {
            // Invalidate and refetch relevant queries to update the UI with consistent query keys
            await Promise.all([
                // Main admin pages list
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
                // Frontend navigation pages
                queryClient.invalidateQueries({ queryKey: ['pages'] }),
                queryClient.invalidateQueries({ queryKey: ['frontend-pages'] }),
                // Remove specific page data from cache
                queryClient.removeQueries({ queryKey: ['pageSections', pageId] }),
                queryClient.removeQueries({ queryKey: ['pageFields', pageId] }),
            ]);
            
            if (showNotifications) {
                notifications.show({
                    title: 'Page Deleted Successfully',
                    message: `Page "${pageId}" was deleted successfully and removed from all menus!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }
            
            // Call custom success handler if provided
            onSuccess?.(pageId);
        },
        
        onError: (error: any, pageId: number) => {
            
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