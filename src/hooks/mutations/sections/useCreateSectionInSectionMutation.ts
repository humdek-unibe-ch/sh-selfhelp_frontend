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
import { AdminApi } from '../../../api/admin';
import { parseApiError } from '../../../utils/mutation-error-handler';

interface ICreateSectionInSectionMutationOptions {
    onSuccess?: (data: any, variables: ICreateSectionInSectionVariables) => void;
    onError?: (error: any, variables: ICreateSectionInSectionVariables) => void;
    showNotifications?: boolean;
    pageId?: number; // Optional page ID for cache invalidation
}

interface ICreateSectionInSectionData {
    styleId: number;
    position: number;
}

interface ICreateSectionInSectionVariables {
    pageId: number;
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
    const { onSuccess, onError, showNotifications = true, pageId: cachePageId } = options;

    return useMutation({
        mutationFn: ({ pageId, parentSectionId, sectionData }: ICreateSectionInSectionVariables) => 
            AdminApi.createSectionInSection(pageId, parentSectionId, sectionData),
        
        onSuccess: async (createdSection: any, variables: ICreateSectionInSectionVariables) => {
            
            // Invalidate relevant queries to update the UI
            const invalidationPromises = [
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
            ];
            
            // If pageId is provided, also invalidate page-specific queries
            if (cachePageId) {
                invalidationPromises.push(
                    queryClient.invalidateQueries({ queryKey: ['pageSections', cachePageId] }),
                    queryClient.refetchQueries({ queryKey: ['pageSections', cachePageId] }),
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