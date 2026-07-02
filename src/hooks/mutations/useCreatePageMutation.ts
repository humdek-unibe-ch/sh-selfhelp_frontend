/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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
import { AdminApi } from '../../api/admin';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';
import { invalidateAdminNavigationQueries } from '../../utils/admin-navigation-cache.utils';
import { type ICreatePageRequest } from '../../types/requests/admin/create-page.types';
import { type IAdminPage } from '../../types/responses/admin/admin.types';
import { parseApiError } from '../../utils/mutation-error-handler';

interface ICreatePageMutationOptions {
    onSuccess?: (data: IAdminPage) => void | Promise<void>;
    onError?: (error: unknown) => void;
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

            // Invalidate the caches the read hooks actually subscribe to so
            // active observers refetch fresh data. Keys come from the central
            // registry (react-query.config.ts) to prevent key drift; a single
            // `invalidateQueries` already refetches active queries, so the
            // previous refetch+remove churn is unnecessary.
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES }),
                invalidateAdminNavigationQueries(queryClient),
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
            void onSuccess?.(createdPage);
        },
        
        onError: (error: unknown) => {
            
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