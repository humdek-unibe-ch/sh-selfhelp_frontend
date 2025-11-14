'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminSectionApi } from '../../../api/admin/section.api';
import { IUpdateSectionMutationVariables } from '../../../types/requests/admin/update-section.types';

interface IUpdateSectionMutationOptions {
    showNotifications?: boolean;
    pageId?: number;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function useUpdateSectionMutation({
    showNotifications = true,
    pageId,
    onSuccess,
    onError
}: IUpdateSectionMutationOptions = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ 
            pageId: mutationPageId, 
            sectionId, 
            sectionData 
        }: IUpdateSectionMutationVariables) => {

            const result = await AdminSectionApi.updateSection(mutationPageId, sectionId, sectionData);
            
            return result;
        },
        onSuccess: (data, variables) => {
            // Invalidate relevant queries to refresh data with consistent query keys
            const queryKey = pageId || variables.pageId;
            
            queryClient.invalidateQueries({ queryKey: ['pageSections', queryKey] });

            if (showNotifications) {
                notifications.show({
                    title: 'Section Updated',
                    message: 'Section has been successfully updated',
                    color: 'green',
                    icon: React.createElement(IconCheck, { size: 16 }),
                    autoClose: 3000,
                });
            }

            onSuccess?.();
        },
        onError: (error: Error, variables: IUpdateSectionMutationVariables) => {

            if (showNotifications) {
                notifications.show({
                    title: 'Update Failed',
                    message: error.message || 'Failed to update section. Please try again.',
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            }

            onError?.(error);
        },
    });
} 