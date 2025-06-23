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
import { AdminApi } from '../../../api/admin.api';
import { debug } from '../../../utils/debug-logger';
import { parseApiError } from '../../../utils/mutation-error-handler';

interface IDeleteSectionMutationOptions {
    onSuccess?: (data: any, variables: { keyword: string; sectionId: number }) => void;
    onError?: (error: any, variables: { keyword: string; sectionId: number }) => void;
    showNotifications?: boolean;
    pageKeyword?: string; // Optional page keyword for cache invalidation
}

interface IDeleteSectionVariables {
    keyword: string;
    sectionId: number;
}

/**
 * React Query mutation hook for deleting sections
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useDeleteSectionMutation(options: IDeleteSectionMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true, pageKeyword } = options;

    return useMutation({
        mutationFn: ({ keyword, sectionId }: IDeleteSectionVariables) => 
            AdminApi.deleteSection(keyword, sectionId),
        
        onSuccess: async (result: any, variables: IDeleteSectionVariables) => {
            debug('Section deleted successfully', 'useDeleteSectionMutation', { 
                keyword: variables.keyword,
                sectionId: variables.sectionId,
                result 
            });
            
            // Invalidate relevant queries to update the UI
            const invalidationPromises = [
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
            ];
            
            // If pageKeyword is provided, also invalidate page-specific queries
            if (pageKeyword) {
                invalidationPromises.push(
                    queryClient.invalidateQueries({ queryKey: ['pageSections', pageKeyword] }),
                    queryClient.invalidateQueries({ queryKey: ['pageFields', pageKeyword] })
                );
            } else {
                // Use the keyword from variables if pageKeyword not provided
                invalidationPromises.push(
                    queryClient.invalidateQueries({ queryKey: ['pageSections', variables.keyword] }),
                    queryClient.invalidateQueries({ queryKey: ['pageFields', variables.keyword] })
                );
            }
            
            // Remove specific section details from cache
            queryClient.removeQueries({ 
                queryKey: ['sectionDetails', pageKeyword || variables.keyword, variables.sectionId] 
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
            debug('Error deleting section', 'useDeleteSectionMutation', { error, variables });
            
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