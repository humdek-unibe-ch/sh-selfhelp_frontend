/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';
import { invalidateAdminNavigationQueries } from '../../utils/admin-navigation-cache.utils';

interface IDeletePageMutationOptions {
    onSuccess?: (pageId: number) => void;
    onError?: (error: unknown) => void;
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
            if (page?.is_system) {
                throw new Error('System pages cannot be deleted');
            }
            return AdminApi.deletePage(pageId);
        },
        
        onSuccess: async (result, pageId: number) => {
            // Let the caller navigate away from `/admin/pages/{keyword}` before
            // touching shared caches so the deleted page editor does not wake
            // its detail readers one more time during the redirect.
            onSuccess?.(pageId);

            // Drop the deleted page's now-orphaned detail caches and then
            // refresh the shared list/nav readers that the route depends on.
            await Promise.all([
                queryClient.cancelQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_SECTIONS(pageId) }),
                queryClient.cancelQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_FIELDS(pageId) }),
            ]);

            queryClient.removeQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_SECTIONS(pageId) });
            queryClient.removeQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_FIELDS(pageId) });

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES }),
                invalidateAdminNavigationQueries(queryClient),
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
            
        },
        
        onError: (error: unknown, _pageId: number) => {
            
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
