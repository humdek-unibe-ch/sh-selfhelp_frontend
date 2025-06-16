/**
 * React Query mutation hook for updating sections within other sections.
 * Provides error handling, cache invalidation, and success notifications.
 * 
 * @module hooks/mutations/sections/useUpdateSectionInSectionMutation
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminApi } from '../../../api/admin.api';
import { debug } from '../../../utils/debug-logger';
import { parseApiError } from '../../../utils/mutation-error-handler';

interface IUpdateSectionInSectionMutationOptions {
    onSuccess?: (data: any, variables: { parentSectionId: number; childSectionId: number; sectionData: any }) => void;
    onError?: (error: any, variables: { parentSectionId: number; childSectionId: number; sectionData: any }) => void;
    showNotifications?: boolean;
    pageKeyword?: string; // Optional page keyword for cache invalidation
}

interface IUpdateSectionInSectionVariables {
    parentSectionId: number;
    childSectionId: number;
    sectionData: any;
}

/**
 * React Query mutation hook for updating sections within other sections
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useUpdateSectionInSectionMutation(options: IUpdateSectionInSectionMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true, pageKeyword } = options;

    return useMutation({
        mutationFn: ({ parentSectionId, childSectionId, sectionData }: IUpdateSectionInSectionVariables) => 
            AdminApi.updateSectionInSection(parentSectionId, childSectionId, sectionData),
        
        onSuccess: async (updatedSection: any, variables: IUpdateSectionInSectionVariables) => {
            debug('Section updated in section successfully', 'useUpdateSectionInSectionMutation', { 
                parentSectionId: variables.parentSectionId,
                childSectionId: variables.childSectionId,
                updatedSection 
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
            }
            
            await Promise.all(invalidationPromises);
            
            if (showNotifications) {
                notifications.show({
                    title: 'Section Updated Successfully',
                    message: `Section was updated within parent section successfully!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }
            
            // Call custom success handler if provided
            onSuccess?.(updatedSection, variables);
        },
        
        onError: (error: any, variables: IUpdateSectionInSectionVariables) => {
            debug('Error updating section in section', 'useUpdateSectionInSectionMutation', { error, variables });
            
            // Use centralized error parsing
            const { errorMessage, errorTitle } = parseApiError(error);
            
            if (showNotifications) {
                notifications.show({
                    title: errorTitle || 'Update Section Failed',
                    message: errorMessage || `Failed to update section within parent section. Please try again.`,
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