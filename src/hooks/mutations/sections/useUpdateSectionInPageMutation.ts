/**
 * React Query mutation hook for updating sections in pages.
 * Provides error handling, cache invalidation, and success notifications.
 * 
 * @module hooks/mutations/sections/useUpdateSectionInPageMutation
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminApi } from '../../../api/admin.api';
import { debug } from '../../../utils/debug-logger';
import { parseApiError } from '../../../utils/mutation-error-handler';

interface IUpdateSectionInPageMutationOptions {
    onSuccess?: (data: any, variables: { keyword: string; sectionId: number; sectionData: any }) => void;
    onError?: (error: any, variables: { keyword: string; sectionId: number; sectionData: any }) => void;
    showNotifications?: boolean;
}

interface IUpdateSectionInPageVariables {
    keyword: string;
    sectionId: number;
    sectionData: any;
}

/**
 * React Query mutation hook for updating sections in pages
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useUpdateSectionInPageMutation(options: IUpdateSectionInPageMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: ({ keyword, sectionId, sectionData }: IUpdateSectionInPageVariables) => 
            AdminApi.updateSectionInPage(keyword, sectionId, sectionData),
        
        onSuccess: async (updatedSection: any, variables: IUpdateSectionInPageVariables) => {
            debug('Section updated in page successfully', 'useUpdateSectionInPageMutation', { 
                keyword: variables.keyword, 
                sectionId: variables.sectionId,
                updatedSection 
            });
            
            // Invalidate relevant queries to update the UI
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['pageSections', variables.keyword] }),
                queryClient.invalidateQueries({ queryKey: ['pageFields', variables.keyword] }),
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
            ]);
            
            if (showNotifications) {
                notifications.show({
                    title: 'Section Updated Successfully',
                    message: `Section was updated in page "${variables.keyword}" successfully!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }
            
            // Call custom success handler if provided
            onSuccess?.(updatedSection, variables);
        },
        
        onError: (error: any, variables: IUpdateSectionInPageVariables) => {
            debug('Error updating section in page', 'useUpdateSectionInPageMutation', { error, variables });
            
            // Use centralized error parsing
            const { errorMessage, errorTitle } = parseApiError(error);
            
            if (showNotifications) {
                notifications.show({
                    title: errorTitle || 'Update Section Failed',
                    message: errorMessage || `Failed to update section in page "${variables.keyword}". Please try again.`,
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