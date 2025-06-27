'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminSectionApi } from '../../../api/admin/section.api';
import { debug } from '../../../utils/debug-logger';

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
    pageKeyword?: string;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function useUpdateSectionMutation({
    showNotifications = true,
    pageKeyword,
    onSuccess,
    onError
}: IUpdateSectionMutationOptions = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ 
            keyword, 
            sectionId, 
            sectionData 
        }: { 
            keyword: string; 
            sectionId: number; 
            sectionData: IUpdateSectionRequest;
        }) => {
            debug('Updating section', 'useUpdateSectionMutation', { 
                keyword, 
                sectionId, 
                sectionData,
                changesCount: (sectionData.sectionName ? 1 : 0) + 
                             sectionData.contentFields.length + 
                             sectionData.propertyFields.length
            });

            const result = await AdminSectionApi.updateSection(keyword, sectionId, sectionData);
            
            debug('Section updated successfully', 'useUpdateSectionMutation', { 
                keyword, 
                sectionId, 
                result 
            });
            
            return result;
        },
        onSuccess: (data, variables) => {
            debug('Section update mutation success', 'useUpdateSectionMutation', { 
                sectionId: variables.sectionId,
                keyword: variables.keyword,
                data 
            });

            // Invalidate relevant queries to refresh data with consistent query keys
            const queryKey = pageKeyword || variables.keyword;
            
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
        onError: (error: Error, variables: { keyword: string; sectionId: number; sectionData: IUpdateSectionRequest }) => {
            debug('Section update mutation error', 'useUpdateSectionMutation', { 
                error: error.message,
                sectionId: variables.sectionId,
                keyword: variables.keyword
            });

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