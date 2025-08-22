'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminSectionApi } from '../../../api/admin/section.api';

interface IUpdateSectionRequest {
    // Section name (only if changed)
    sectionName?: string;
    
    // Content fields with language and field IDs (only changed fields)
    contentFields: Array<{
        fieldId: number;
        languageId: number;
        value: string;
    }>;
    
    // Property fields (only changed fields)
    propertyFields: Array<{
        fieldId: number;
        value: string | boolean;
    }>;
}

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
        }: { 
            pageId: number; 
            sectionId: number; 
            sectionData: IUpdateSectionRequest;
        }) => {

            const result = await AdminSectionApi.updateSection(mutationPageId, sectionId, sectionData);
            
            return result;
        },
        onSuccess: (data, variables) => {
            // Invalidate relevant queries to refresh data with consistent query keys
            const queryKey = pageId || variables.pageId;
            
            // Main admin pages list
            queryClient.invalidateQueries({ queryKey: ['adminPages'] });
            
            // Page-specific data
            queryClient.invalidateQueries({ queryKey: ['pageFields', queryKey] });
            queryClient.invalidateQueries({ queryKey: ['pageSections', queryKey] });
            
            // Section-specific data (using the correct query key pattern)
            queryClient.invalidateQueries({ 
                queryKey: ['admin', 'sections', 'details', queryKey, variables.sectionId] 
            });
            
            // Frontend navigation pages
            queryClient.invalidateQueries({ queryKey: ['pages'] });
            queryClient.invalidateQueries({ queryKey: ['page-content'] });
            queryClient.invalidateQueries({ queryKey: ['frontend-pages'] });

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
        onError: (error: Error, variables: { pageId: number; sectionId: number; sectionData: IUpdateSectionRequest }) => {

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