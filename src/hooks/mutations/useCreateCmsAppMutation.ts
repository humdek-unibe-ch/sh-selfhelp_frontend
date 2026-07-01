/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * React Query mutation hook for the CMS-in-CMS "Create list + detail pages"
 * wizard (issue #30, Phase 6). Invalidates the page list caches and surfaces
 * notifications on completion.
 *
 * @module hooks/mutations/useCreateCmsAppMutation
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminApi } from '../../api/admin';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';
import {
    type ICreateCmsAppRequest,
    type ICreateCmsAppResult
} from '../../types/requests/admin/cms-app-wizard.types';
import { parseApiError } from '../../utils/mutation-error-handler';

interface ICreateCmsAppMutationOptions {
    onSuccess?: (data: ICreateCmsAppResult) => void | Promise<void>;
    onError?: (error: unknown) => void;
    showNotifications?: boolean;
}

/**
 * React Query mutation hook for the CMS app wizard.
 * @param options Configuration options for the mutation
 * @returns useMutation result with cache invalidation and notifications
 */
export function useCreateCmsAppMutation(options: ICreateCmsAppMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: (payload: ICreateCmsAppRequest) => AdminApi.createCmsApp(payload),

        onSuccess: async (result: ICreateCmsAppResult) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES }),
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FRONTEND_PAGES_ALL }),
            ]);

            if (showNotifications) {
                notifications.show({
                    title: 'Pages Created',
                    message: `Created ${result.created.length} page(s) successfully.`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }

            void onSuccess?.(result);
        },

        onError: (error: unknown) => {
            const { errorMessage, errorTitle } = parseApiError(error);

            if (showNotifications) {
                notifications.show({
                    title: errorTitle,
                    message: errorMessage,
                    icon: React.createElement(IconX, { size: '1rem' }),
                    color: 'red',
                    autoClose: 8000,
                    position: 'top-center',
                });
            }

            onError?.(error);
        },
    });
}
