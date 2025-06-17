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
import { debug } from '../../../utils/debug-logger';
import { parseApiError } from '../../../utils/mutation-error-handler';

interface IRemoveSectionFromPageMutationOptions {
    onSuccess?: (variables: { keyword: string; sectionId: number }) => void;
    onError?: (error: any, variables: { keyword: string; sectionId: number }) => void;
    showNotifications?: boolean;
}

interface IRemoveSectionFromPageVariables {
    keyword: string;
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
        mutationFn: ({ keyword, sectionId }: IRemoveSectionFromPageVariables) => 
            AdminApi.removeSectionFromPage(keyword, sectionId),
        
        onSuccess: async (result, variables: IRemoveSectionFromPageVariables) => {
            debug('Section removed from page successfully', 'useRemoveSectionFromPageMutation', { 
                keyword: variables.keyword, 
                sectionId: variables.sectionId,
                result
            });
            
            // Invalidate relevant queries to update the UI
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['pageSections', variables.keyword] }),
                queryClient.invalidateQueries({ queryKey: ['pageFields', variables.keyword] }),
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
            ]);
            
            if (showNotifications) {
                notifications.show({
                    title: 'Section Removed Successfully',
                    message: `Section was removed from page "${variables.keyword}" successfully!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }
            
            // Call custom success handler if provided
            onSuccess?.(variables);
        },
        
        onError: (error: any, variables: IRemoveSectionFromPageVariables) => {
            debug('Error removing section from page', 'useRemoveSectionFromPageMutation', { error, variables });
            
            // Use centralized error parsing
            const { errorMessage, errorTitle } = parseApiError(error);
            
            if (showNotifications) {
                notifications.show({
                    title: errorTitle || 'Remove Section Failed',
                    message: errorMessage || `Failed to remove section from page "${variables.keyword}". Please try again.`,
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