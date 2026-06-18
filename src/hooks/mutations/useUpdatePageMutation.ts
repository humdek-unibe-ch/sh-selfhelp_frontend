/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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
import { AdminApi } from '../../api/admin';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';
import { type IUpdatePageRequest } from '../../types/requests/admin/update-page.types';
import { type IAdminPage } from '../../types/responses/admin/admin.types';
import { parseApiError } from '../../utils/mutation-error-handler';

interface IUpdatePageMutationOptions {
    onSuccess?: (data: IAdminPage, pageId: number) => void;
    onError?: (error: unknown, pageId: number) => void;
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

            // Invalidate the caches the read hooks subscribe to (keys from the
            // central registry to prevent drift). `invalidateQueries` already
            // refetches active observers, so no extra refetch/remove churn.
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES }),
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_FIELDS(pageId) }),
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_SECTIONS(pageId) }),
                queryClient.invalidateQueries({ queryKey: ['page-by-keyword'] }),
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FRONTEND_PAGES_ALL }),
            ]);

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
        
        onError: (error: unknown, { pageId }: IUpdatePageMutationVariables) => {
            
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