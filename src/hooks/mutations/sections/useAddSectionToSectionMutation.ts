/**
 * React Query mutation hook for adding existing sections to other sections.
 * Provides error handling, cache invalidation, and success notifications.
 * 
 * @module hooks/mutations/sections/useAddSectionToSectionMutation
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminApi } from '../../../api/admin.api';
import { parseApiError } from '../../../utils/mutation-error-handler';

interface IAddSectionToSectionMutationOptions {
    onSuccess?: (data: any, variables: { keyword: string; parentSectionId: number; sectionId: number; sectionData: IAddSectionToSectionData }) => void;
    onError?: (error: any, variables: { keyword: string; parentSectionId: number; sectionId: number; sectionData: IAddSectionToSectionData }) => void;
    showNotifications?: boolean;
    pageKeyword?: string; // Optional page keyword for cache invalidation
}

interface IAddSectionToSectionData {
    position: number;
}

interface IAddSectionToSectionVariables {
    keyword: string;
    parentSectionId: number;
    sectionId: number;
    sectionData: IAddSectionToSectionData;
}

/**
 * React Query mutation hook for adding existing sections to other sections
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useAddSectionToSectionMutation(options: IAddSectionToSectionMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true, pageKeyword } = options;

    return useMutation({
        mutationFn: ({ keyword, parentSectionId, sectionId, sectionData }: IAddSectionToSectionVariables) => 
            AdminApi.addSectionToSection(keyword, parentSectionId, sectionId, sectionData),
        
        onSuccess: async (createdSection: any, variables: IAddSectionToSectionVariables) => {
            
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
                    title: 'Section Added Successfully',
                    message: `Section was added to parent section successfully!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }
            
            // Call custom success handler if provided
            onSuccess?.(createdSection, variables);
        },
        
        onError: (error: any, variables: IAddSectionToSectionVariables) => {
            
            // Use centralized error parsing
            const { errorMessage, errorTitle } = parseApiError(error);
            
            if (showNotifications) {
                notifications.show({
                    title: errorTitle || 'Add Section Failed',
                    message: errorMessage || `Failed to add section to parent section. Please try again.`,
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