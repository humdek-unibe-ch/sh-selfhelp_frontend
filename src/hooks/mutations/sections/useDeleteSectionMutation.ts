/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminSectionApi } from '../../../api/admin/section.api';
import { REACT_QUERY_CONFIG } from '../../../config/react-query.config';
import { parseApiError } from '../../../utils/mutation-error-handler';

interface IDeleteSectionMutationOptions {
    onSuccess?: (data: unknown, variables: { sectionId: number }) => void;
    onError?: (error: unknown, variables: { sectionId: number }) => void;
    showNotifications?: boolean;
}

interface IDeleteSectionVariables {
    sectionId: number;
}

export function useDeleteSectionMutation(options: IDeleteSectionMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: ({ sectionId }: IDeleteSectionVariables) =>
            AdminSectionApi.deleteSection(sectionId),

        onSuccess: async (result: unknown, variables: IDeleteSectionVariables) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_SECTIONS_ALL }),
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_SECTIONS_REF_CONTAINERS }),
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_SECTIONS_UNUSED }),
            ]);

            if (showNotifications) {
                notifications.show({
                    title: 'Section Deleted Successfully',
                    message: 'Section was permanently deleted!',
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }

            onSuccess?.(result, variables);
        },

        onError: (error: unknown, variables: IDeleteSectionVariables) => {
            const { errorMessage, errorTitle } = parseApiError(error);

            if (showNotifications) {
                notifications.show({
                    title: errorTitle || 'Delete Section Failed',
                    message: errorMessage || 'Failed to delete section. Please try again.',
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
