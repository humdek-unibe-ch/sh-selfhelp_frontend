/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * React Query mutation hook for importing a page bundle (issue #30, Phase 5).
 * Invalidates the page list caches and surfaces notifications on completion.
 *
 * @module hooks/mutations/useImportPagesMutation
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminApi } from '../../api/admin';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';
import { invalidateAdminNavigationQueries } from '../../utils/admin-navigation-cache.utils';
import {
    type IPageBundle,
    type IPageImportOptions,
    type IPageImportResult
} from '../../types/requests/admin/page-export-import.types';
import { parseApiError } from '../../utils/mutation-error-handler';

interface IImportPagesVariables {
    bundle: IPageBundle;
    options?: IPageImportOptions;
}

interface IImportPagesMutationOptions {
    onSuccess?: (data: IPageImportResult) => void | Promise<void>;
    onError?: (error: unknown) => void;
    showNotifications?: boolean;
}

/**
 * React Query mutation hook for importing a page bundle.
 * @param options Configuration options for the mutation
 * @returns useMutation result with cache invalidation and notifications
 */
export function useImportPagesMutation(options: IImportPagesMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: ({ bundle, options: importOptions }: IImportPagesVariables) =>
            AdminApi.importPages(bundle, importOptions ?? {}),

        onSuccess: async (result: IPageImportResult) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES }),
                invalidateAdminNavigationQueries(queryClient),
            ]);

            if (showNotifications) {
                notifications.show({
                    title: 'Pages Imported',
                    message: `Imported ${result.created.length} page(s) successfully.`,
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
