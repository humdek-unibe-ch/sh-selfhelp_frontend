/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * React Query mutation hook for removing sections from other sections.
 * Provides error handling, cache invalidation, and success notifications.
 * 
 * @module hooks/mutations/sections/useRemoveSectionFromSectionMutation
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminApi } from '../../../api/admin';
import { REACT_QUERY_CONFIG } from '../../../config/react-query.config';
import { parseApiError } from '../../../utils/mutation-error-handler';

interface IRemoveSectionFromSectionMutationOptions {
    onSuccess?: (data: unknown, variables: { pageId: number; parentSectionId: number; childSectionId: number }) => void;
    onError?: (error: unknown, variables: { pageId: number; parentSectionId: number; childSectionId: number }) => void;
    showNotifications?: boolean;
    pageId?: number; // Optional page ID for cache invalidation
}

interface IRemoveSectionFromSectionVariables {
    pageId: number;
    parentSectionId: number;
    childSectionId: number;
}

/**
 * React Query mutation hook for removing sections from other sections
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useRemoveSectionFromSectionMutation(options: IRemoveSectionFromSectionMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true, pageId: cachePageId } = options;

    return useMutation({
        mutationFn: ({ pageId, parentSectionId, childSectionId }: IRemoveSectionFromSectionVariables) => 
            AdminApi.removeSectionFromSection(pageId, parentSectionId, childSectionId),
        
        onSuccess: async (result: unknown, variables: IRemoveSectionFromSectionVariables) => {

            // Invalidate relevant queries to update the UI. UNPUBLISHED_CHANGES
            // refreshes the publish-state reader so the "Publish Changes" button
            // reflects the removed child section immediately.
            const invalidationPromises = [
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES }),
                queryClient.refetchQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_SECTIONS(cachePageId) }),
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_SECTIONS_UNUSED }),
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_SECTIONS_REF_CONTAINERS }),
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.UNPUBLISHED_CHANGES(variables.pageId) }),
            ];

            // If pageId is provided, also invalidate page-specific queries
            if (cachePageId) {
                invalidationPromises.push(
                    queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_SECTIONS(cachePageId) }),
                    queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_FIELDS(cachePageId) })
                );
            }

            await Promise.all(invalidationPromises);

            // Also directly refetch the page sections query as a backup
            if (cachePageId) {
                await queryClient.refetchQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_SECTIONS(cachePageId) });
            }
            
            if (showNotifications) {
                notifications.show({
                    title: 'Section Removed Successfully',
                    message: `Section was removed from parent section successfully!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }
            
            // Call custom success handler if provided
            onSuccess?.(result, variables);
        },
        
        onError: (error: unknown, variables: IRemoveSectionFromSectionVariables) => {
            
            // Use centralized error parsing
            const { errorMessage, errorTitle } = parseApiError(error);
            
            if (showNotifications) {
                notifications.show({
                    title: errorTitle || 'Remove Section Failed',
                    message: errorMessage || `Failed to remove section from parent section. Please try again.`,
                    icon: React.createElement(IconX, { size: '1rem' }),
                    color: 'red',
                    autoClose: 8000,
                    position: 'top-center',
                });
            }
            
            // Call custom error handler if provided
            onError?.(error, variables);
        },
    });
} 