'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { AdminApi } from '../../../api/admin.api';
import { ICreateSectionInPageData, ICreateSectionInSectionData } from '../../../types/requests/admin/create-section.types';

interface ICreateSiblingAboveParams {
    referenceSectionId: number;
    parentId: number | null;
    pageKeyword?: string;
    sectionData: ICreateSectionInPageData | ICreateSectionInSectionData; // Both have same structure
}

export function useCreateSiblingAboveMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ referenceSectionId, parentId, pageKeyword, sectionData }: ICreateSiblingAboveParams) => {

            // Calculate position: reference position - 1
            // TODO: Get reference section position from cache or API
            const calculatedPosition = (sectionData.position || 10) - 1;
            
            const finalSectionData = {
                styleId: sectionData.styleId,
                position: calculatedPosition
            };

            if (parentId !== null) {
                // Create sibling in parent section
                if (!pageKeyword) {
                    throw new Error('Page keyword is required for section operations');
                }
                return AdminApi.createSectionInSection(pageKeyword, parentId, finalSectionData);
            } else if (pageKeyword) {
                // Create sibling in page
                return AdminApi.createSectionInPage(pageKeyword, finalSectionData);
            } else {
                throw new Error('Either parentId or pageKeyword must be provided');
            }
        },
        onSuccess: (data, variables) => {

            // Invalidate relevant queries
            if (variables.parentId !== null) {
                queryClient.invalidateQueries({ 
                    queryKey: ['admin', 'sections', variables.parentId] 
                });
            }
            
            if (variables.pageKeyword) {
                queryClient.invalidateQueries({ 
                    queryKey: ['admin', 'pages', variables.pageKeyword, 'sections'] 
                });
            }

            notifications.show({
                title: 'Success',
                message: 'Section created above successfully',
                color: 'green',
            });
        },
        onError: (error: any, variables) => {
            
            notifications.show({
                title: 'Error',
                message: error?.response?.data?.message || 'Failed to create section above',
                color: 'red',
            });
        },
    });
} 