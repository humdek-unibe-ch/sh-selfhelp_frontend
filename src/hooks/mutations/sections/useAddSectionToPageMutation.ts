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
import { parseApiError } from '../../../utils/mutation-error-handler';

interface IAddSectionToPageMutationOptions {
    onSuccess?: (data: any, variables: { pageId: number; sectionId: number; sectionData: IAddSectionToPageData }) => void;
    onError?: (error: any, variables: { pageId: number; sectionId: number; sectionData: IAddSectionToPageData }) => void;
    showNotifications?: boolean;
}

interface IAddSectionToPageData {
    position: number;
}

interface IAddSectionToPageVariables {
    pageId: number;
    sectionId: number;
    sectionData: IAddSectionToPageData;
}

/**
 * React Query mutation hook for adding existing sections to pages
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useAddSectionToPageMutation(options: IAddSectionToPageMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: ({ pageId, sectionId, sectionData }: IAddSectionToPageVariables) => 
            AdminApi.addSectionToPage(pageId, sectionId, sectionData),
        
        onSuccess: async (createdSection: any, variables: IAddSectionToPageVariables) => {
            
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
                    title: 'Section Added Successfully',
                    message: `Section was added to page "${variables.pageId}" successfully!`,
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
            // Use centralized error parsing
            const { errorMessage, errorTitle } = parseApiError(error);
            
            if (showNotifications) {
                notifications.show({
                    title: errorTitle || 'Add Section Failed',
                    message: errorMessage || `Failed to add section to page "${variables.pageId}". Please try again.`,
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