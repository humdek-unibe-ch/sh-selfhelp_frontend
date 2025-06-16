/**
 * React Query mutation hook for adding sections to pages.
 * Provides error handling, cache invalidation, and success notifications.
 * 
 * @module hooks/mutations/sections/useAddSectionToPageMutation
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminApi } from '../../../api/admin.api';
import { debug } from '../../../utils/debug-logger';
import { parseApiError } from '../../../utils/mutation-error-handler';

interface IAddSectionToPageMutationOptions {
    onSuccess?: (data: any, variables: { keyword: string; sectionData: any }) => void;
    onError?: (error: any, variables: { keyword: string; sectionData: any }) => void;
    showNotifications?: boolean;
}

interface IAddSectionToPageVariables {
    keyword: string;
    sectionData: any;
}

/**
 * React Query mutation hook for adding sections to pages
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useAddSectionToPageMutation(options: IAddSectionToPageMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: ({ keyword, sectionData }: IAddSectionToPageVariables) => 
            AdminApi.addSectionToPage(keyword, sectionData),
        
        onSuccess: async (createdSection: any, variables: IAddSectionToPageVariables) => {
            debug('Section added to page successfully', 'useAddSectionToPageMutation', { 
                keyword: variables.keyword, 
                createdSection 
            });
            
            // Invalidate relevant queries to update the UI
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['pageSections', variables.keyword] }),
                queryClient.invalidateQueries({ queryKey: ['pageFields', variables.keyword] }),
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
            ]);
            
            if (showNotifications) {
                notifications.show({
                    title: 'Section Added Successfully',
                    message: `Section was added to page "${variables.keyword}" successfully!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }
            
            // Call custom success handler if provided
            onSuccess?.(createdSection, variables);
        },
        
        onError: (error: any, variables: IAddSectionToPageVariables) => {
            debug('Error adding section to page', 'useAddSectionToPageMutation', { error, variables });
            
            // Use centralized error parsing
            const { errorMessage, errorTitle } = parseApiError(error);
            
            if (showNotifications) {
                notifications.show({
                    title: errorTitle || 'Add Section Failed',
                    message: errorMessage || `Failed to add section to page "${variables.keyword}". Please try again.`,
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