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
import { AdminApi } from '../../../api/admin.api';
import { parseApiError } from '../../../utils/mutation-error-handler';

interface IRemoveSectionFromSectionMutationOptions {
    onSuccess?: (data: any, variables: { pageId: number; parentSectionId: number; childSectionId: number }) => void;
    onError?: (error: any, variables: { pageId: number; parentSectionId: number; childSectionId: number }) => void;
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
        
        onSuccess: async (result: any, variables: IRemoveSectionFromSectionVariables) => {

            // Invalidate relevant queries to update the UI
            const invalidationPromises = [
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
                queryClient.refetchQueries({ queryKey: ['pageSections', cachePageId] }),
            ];

            // If pageId is provided, also invalidate page-specific queries
            if (cachePageId) {
                invalidationPromises.push(
                    queryClient.invalidateQueries({ queryKey: ['pageSections', cachePageId] }),
                    queryClient.invalidateQueries({ queryKey: ['pageFields', cachePageId] })
                );
            }

            await Promise.all(invalidationPromises);

            // Also directly refetch the page sections query as a backup
            if (cachePageId) {
                await queryClient.refetchQueries({ queryKey: ['pageSections', cachePageId] });
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
        
        onError: (error: any, variables: IRemoveSectionFromSectionVariables) => {
            
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