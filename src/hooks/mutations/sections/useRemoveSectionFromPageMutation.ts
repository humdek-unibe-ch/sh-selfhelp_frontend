/**
 * React Query mutation hook for removing sections from pages.
 * Provides error handling, cache invalidation, and success notifications.
 * 
 * @module hooks/mutations/sections/useRemoveSectionFromPageMutation
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminApi } from '../../../api/admin.api';
import { parseApiError } from '../../../utils/mutation-error-handler';

interface IRemoveSectionFromPageMutationOptions {
    onSuccess?: (data: any, variables: { pageId: number; sectionId: number }) => void;
    onError?: (error: any, variables: { pageId: number; sectionId: number }) => void;
    showNotifications?: boolean;
}

interface IRemoveSectionFromPageVariables {
    pageId: number;
    sectionId: number;
}

/**
 * React Query mutation hook for removing sections from pages
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useRemoveSectionFromPageMutation(options: IRemoveSectionFromPageMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: ({ pageId, sectionId }: IRemoveSectionFromPageVariables) => 
            AdminApi.removeSectionFromPage(pageId, sectionId),
        
        onSuccess: async (result: any, variables: IRemoveSectionFromPageVariables) => {
            
            // Invalidate relevant queries to update the UI
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['pageSections', variables.pageId] }),
                queryClient.invalidateQueries({ queryKey: ['pageFields', variables.pageId] }),
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
            ]);
            
            if (showNotifications) {
                notifications.show({
                    title: 'Section Removed Successfully',
                    message: `Section was removed from page "${variables.pageId}" successfully!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }
            
            // Call custom success handler if provided
            onSuccess?.(result, variables);
        },
        
        onError: (error: any, variables: IRemoveSectionFromPageVariables) => {
            
            // Use centralized error parsing
            const { errorMessage, errorTitle } = parseApiError(error);
            
            if (showNotifications) {
                notifications.show({
                    title: errorTitle || 'Remove Section Failed',
                    message: errorMessage || `Failed to remove section from page "${variables.pageId}". Please try again.`,
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