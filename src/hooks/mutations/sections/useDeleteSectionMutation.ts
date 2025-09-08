/**
 * React Query mutation hook for deleting sections.
 * Provides error handling, cache invalidation, and success notifications.
 * 
 * @module hooks/mutations/sections/useDeleteSectionMutation
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminSectionApi } from '../../../api/admin/section.api';
import { parseApiError } from '../../../utils/mutation-error-handler';

interface IDeleteSectionMutationOptions {
    onSuccess?: (data: any, variables: { pageId: number; sectionId: number }) => void;
    onError?: (error: any, variables: { pageId: number; sectionId: number }) => void;
    showNotifications?: boolean;
    pageId?: number; // Optional page ID for cache invalidation
}

interface IDeleteSectionVariables {
    pageId: number;
    sectionId: number;
}

/**
 * React Query mutation hook for deleting sections
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useDeleteSectionMutation(options: IDeleteSectionMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true, pageId: cachePageId } = options;

    return useMutation({
        mutationFn: ({ pageId, sectionId }: IDeleteSectionVariables) => 
            AdminSectionApi.deleteSection(pageId, sectionId),
        
        onSuccess: async (result: any, variables: IDeleteSectionVariables) => {

            // Invalidate relevant queries to update the UI with consistent query keys
            const invalidationPromises = [
                queryClient.invalidateQueries({ queryKey: ['pageSections', cachePageId] }),
            ];
            
            // Remove specific section details from cache
            queryClient.removeQueries({ 
                queryKey: ['sectionDetails', cachePageId || variables.pageId, variables.sectionId] 
            });
            
            await Promise.all(invalidationPromises);
            
            if (showNotifications) {
                notifications.show({
                    title: 'Section Deleted Successfully',
                    message: `Section was permanently deleted!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }
            
            // Call custom success handler if provided
            onSuccess?.(result, variables);
        },
        
        onError: (error: any, variables: IDeleteSectionVariables) => {
            
            // Use centralized error parsing
            const { errorMessage, errorTitle } = parseApiError(error);
            
            if (showNotifications) {
                notifications.show({
                    title: errorTitle || 'Delete Section Failed',
                    message: errorMessage || `Failed to delete section. Please try again.`,
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