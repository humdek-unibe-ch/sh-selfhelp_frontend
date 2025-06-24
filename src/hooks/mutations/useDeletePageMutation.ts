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
import { AdminApi } from '../../api/admin.api';
import { debug } from '../../utils/debug-logger';
import { parseApiError } from '../../utils/mutation-error-handler';
import { useAdminPages } from '../useAdminPages';

interface IDeletePageMutationOptions {
    onSuccess?: (keyword: string) => void;
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
        mutationFn: (keyword: string) => {
            // Check if the page is a system page before attempting deletion
            const page = pages.find(p => p.keyword === keyword);
            if (page?.is_system === 1) {
                throw new Error('System pages cannot be deleted');
            }
            return AdminApi.deletePage(keyword);
        },
        
        onSuccess: async (result, keyword: string) => {
            debug('Page deleted successfully', 'useDeletePageMutation', { keyword, result });
            
            // Invalidate and refetch relevant queries to update the UI
            await Promise.all([
                // Invalidate admin pages list
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
                // Invalidate navigation pages (for frontend navigation)
                queryClient.invalidateQueries({ queryKey: ['pages'] }),
                // Remove specific page data from cache
                queryClient.removeQueries({ queryKey: ['pageSections', keyword] }),
                queryClient.removeQueries({ queryKey: ['pageFields', keyword] }),
            ]);
            
            if (showNotifications) {
                notifications.show({
                    title: 'Page Deleted Successfully',
                    message: `Page "${keyword}" was deleted successfully and removed from all menus!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }
            
            // Call custom success handler if provided
            onSuccess?.(keyword);
        },
        
        onError: (error: any, keyword: string) => {
            debug('Error deleting page', 'useDeletePageMutation', { error, keyword });
            
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