/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminNavigationApi } from '../../api/admin/navigation.api';
import { invalidateAdminNavigationQueries } from '../../utils/admin-navigation-cache.utils';
import {
    type INavigationBundle,
    type INavigationImportOptions,
    type INavigationImportResult,
} from '../../types/requests/admin/navigation-export-import.types';
import { parseApiError } from '../../utils/mutation-error-handler';

interface IImportNavigationVariables {
    bundle: INavigationBundle;
    options?: INavigationImportOptions;
}

interface IImportNavigationMutationOptions {
    onSuccess?: (data: INavigationImportResult) => void | Promise<void>;
    onError?: (error: unknown) => void;
    showNotifications?: boolean;
}

export function useImportNavigationMutation(options: IImportNavigationMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: ({ bundle, options: importOptions }: IImportNavigationVariables) =>
            AdminNavigationApi.importNavigation(bundle, importOptions ?? {}) as Promise<INavigationImportResult>,

        onSuccess: async (result: INavigationImportResult, variables: IImportNavigationVariables) => {
            await invalidateAdminNavigationQueries(queryClient);

            if (showNotifications) {
                const prefix = variables.options?.keywordPrefix?.trim();
                const prefixNote = prefix ? ` Page keywords used prefix "${prefix}".` : '';
                const pageNote = result.imported_pages.length > 0
                    ? ` ${result.imported_pages.length} page(s) were also created or matched.`
                    : '';
                notifications.show({
                    title: 'Navigation imported',
                    message: `Created ${result.created_items} menu item(s) across ${result.imported_menus.length} menu(s).${pageNote}${prefixNote}`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 6000,
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
