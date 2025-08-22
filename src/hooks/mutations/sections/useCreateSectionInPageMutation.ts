/**
 * React Query mutation hook for creating sections in pages.
 * Provides error handling, cache invalidation, and success notifications.
 * 
 * @module hooks/mutations/sections/useCreateSectionInPageMutation
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminApi } from '../../../api/admin.api';
import { parseApiError } from '../../../utils/mutation-error-handler';

interface ICreateSectionInPageMutationOptions {
    onSuccess?: (data: any, variables: ICreateSectionInPageVariables) => void;
    onError?: (error: any, variables: ICreateSectionInPageVariables) => void;
    showNotifications?: boolean;
}

interface ICreateSectionInPageData {
    styleId: number;
    position: number;
}

interface ICreateSectionInPageVariables {
    pageId: number;
    sectionData: ICreateSectionInPageData;
}

/**
 * React Query mutation hook for creating new sections in pages from styles
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useCreateSectionInPageMutation(options: ICreateSectionInPageMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: ({ pageId, sectionData }: ICreateSectionInPageVariables) => 
            AdminApi.createSectionInPage(pageId, sectionData),
        
        onSuccess: async (createdSection: any, variables: ICreateSectionInPageVariables) => {
            
            // Invalidate relevant queries to update the UI with consistent query keys
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['pageSections', variables.pageId] }),
                queryClient.invalidateQueries({ queryKey: ['pageFields', variables.pageId] }),
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
                // Frontend navigation pages
                queryClient.invalidateQueries({ queryKey: ['pages'] }),
                queryClient.invalidateQueries({ queryKey: ['frontend-pages'] }),
                queryClient.invalidateQueries({ queryKey: ['page-content'] }),
            ]);
            
            if (showNotifications) {
                notifications.show({
                    title: 'Section Created Successfully',
                    message: `Section was created in page "${variables.pageId}" successfully!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }
            
            // Call custom success handler if provided
            onSuccess?.(createdSection, variables);
        },
        
        onError: (error: any, variables: ICreateSectionInPageVariables) => {
            
            // Use centralized error parsing
            const { errorMessage, errorTitle } = parseApiError(error);
            
            if (showNotifications) {
                notifications.show({
                    title: errorTitle || 'Create Section Failed',
                    message: errorMessage || `Failed to create section in page "${variables.pageId}". Please try again.`,
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