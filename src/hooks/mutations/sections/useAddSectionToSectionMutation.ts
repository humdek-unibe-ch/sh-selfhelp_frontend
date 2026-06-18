/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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
import { AdminApi } from '../../../api/admin';
import { REACT_QUERY_CONFIG } from '../../../config/react-query.config';
import { parseApiError } from '../../../utils/mutation-error-handler';
import { type IAddSectionInSectionData } from '../../../types/requests/admin/create-section.types';

interface IAddSectionToSectionMutationOptions {
  onSuccess?: (
    data: unknown,
    variables: {
      pageId: number;
      parentSectionId: number;
      sections: IAddSectionInSectionData[];
     },
  ) => void;

  onError?: (
    error: unknown,
    variables: {
      pageId: number;
      parentSectionId: number;
      sections: IAddSectionInSectionData[];
    },
  ) => void;
  showNotifications?: boolean;
  pageId?: number; // Optional page ID for cache invalidation
}

interface IAddSectionToSectionVariables {
    pageId: number;
    parentSectionId: number;
    sections: IAddSectionInSectionData[];
}

/**
 * React Query mutation hook for adding existing sections to other sections
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useAddSectionToSectionMutation(options: IAddSectionToSectionMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: ({ pageId, parentSectionId, sections }: IAddSectionToSectionVariables) => 
            AdminApi.addSectionToSection(pageId, parentSectionId, sections),
        
        onSuccess: async (createdSection: unknown, variables: IAddSectionToSectionVariables) => {

            // Invalidate relevant queries to update the UI. UNPUBLISHED_CHANGES
            // refreshes the publish-state reader so the "Publish Changes" button
            // reflects the moved/added section immediately.
            const invalidationPromises = [
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_SECTIONS(variables.pageId) }),
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_SECTIONS_UNUSED }),
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.UNPUBLISHED_CHANGES(variables.pageId) }),
            ];
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
        
        onError: (error: unknown, variables: IAddSectionToSectionVariables) => {
            
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
