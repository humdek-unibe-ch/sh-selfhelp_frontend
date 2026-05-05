/**
 * React Query mutation hook for bulk removing sections from pages.
 * Provides error handling, cache invalidation, and success notifications.
 *
 * @module hooks/mutations/sections/useRemoveBulkSectionsFromPageMutation
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminApi } from '../../../api/admin';
import { parseApiError } from '../../../utils/mutation-error-handler';

interface IRemoveBulkSectionsFromPageMutationOptions {
    onSuccess?: (
        data: any,
        variables: { pageId: number; sectionIds: number[] }
    ) => void;
    onError?: (
        error: any,
        variables: { pageId: number; sectionIds: number[] }
    ) => void;
    showNotifications?: boolean;
}

interface IRemoveBulkSectionsFromPageVariables {
    pageId: number;
    sectionIds: number[];
}

/**
 * React Query mutation hook for bulk removing sections from pages
 */
export function useRemoveBulkSectionsFromPageMutation(
    options: IRemoveBulkSectionsFromPageMutationOptions = {}
) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: ({ pageId, sectionIds }: IRemoveBulkSectionsFromPageVariables) =>
            AdminApi.removeBulkSectionsFromPage(pageId, sectionIds),

        onSuccess: async (result: any, variables) => {
            const deletedCount = result?.deleted_count ?? variables.sectionIds.length;

            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ['pageSections', variables.pageId],
                }),
                queryClient.refetchQueries({
                    queryKey: ['pageSections', variables.pageId],
                }),
            ]);

            if (showNotifications) {
                notifications.show({
                    title: 'Sections Removed Successfully',
                    message: `${deletedCount} section(s) removed successfully!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }

            onSuccess?.(result, variables);
        },

        onError: (error: any, variables) => {
            const { errorMessage, errorTitle } = parseApiError(error);

            if (showNotifications) {
                notifications.show({
                    title: errorTitle || 'Bulk Remove Failed',
                    message:
                        errorMessage ||
                        `Failed to remove ${variables.sectionIds.length} section(s). Please try again.`,
                    icon: React.createElement(IconX, { size: '1rem' }),
                    color: 'red',
                    autoClose: 8000,
                    position: 'top-center',
                });
            }

            onError?.(error, variables);
        },
    });
}
