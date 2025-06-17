/**
 * React Query mutation hook for creating sections within other sections.
 * Provides error handling, cache invalidation, and success notifications.
 * 
 * @module hooks/mutations/sections/useCreateSectionInSectionMutation
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminApi } from '../../../api/admin.api';
import { debug } from '../../../utils/debug-logger';
import { parseApiError } from '../../../utils/mutation-error-handler';

interface ICreateSectionInSectionMutationOptions {
    onSuccess?: (data: any, variables: ICreateSectionInSectionVariables) => void;
    onError?: (error: any, variables: ICreateSectionInSectionVariables) => void;
    showNotifications?: boolean;
    pageKeyword?: string; // Optional page keyword for cache invalidation
}

interface ICreateSectionInSectionData {
    styleId: number;
    position: number;
}

interface ICreateSectionInSectionVariables {
    parentSectionId: number;
    sectionData: ICreateSectionInSectionData;
}

/**
 * React Query mutation hook for creating new sections within other sections from styles
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useCreateSectionInSectionMutation(options: ICreateSectionInSectionMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true, pageKeyword } = options;

    return useMutation({
        mutationFn: ({ parentSectionId, sectionData }: ICreateSectionInSectionVariables) => 
            AdminApi.createSectionInSection(parentSectionId, sectionData),
        
        onSuccess: async (createdSection: any, variables: ICreateSectionInSectionVariables) => {
            debug('Section created in section successfully', 'useCreateSectionInSectionMutation', { 
                parentSectionId: variables.parentSectionId,
                styleId: variables.sectionData.styleId,
                position: variables.sectionData.position,
                createdSection 
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
                    title: 'Section Created Successfully',
                    message: `Section was created within parent section successfully!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }
            
            // Call custom success handler if provided
            onSuccess?.(createdSection, variables);
        },
        
        onError: (error: any, variables: ICreateSectionInSectionVariables) => {
            debug('Error creating section in section', 'useCreateSectionInSectionMutation', { error, variables });
            
            // Use centralized error parsing
            const { errorMessage, errorTitle } = parseApiError(error);
            
            if (showNotifications) {
                notifications.show({
                    title: errorTitle || 'Create Section Failed',
                    message: errorMessage || `Failed to create section within parent section. Please try again.`,
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