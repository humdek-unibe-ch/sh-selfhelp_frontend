/**
 * React Query mutation hooks for language CRUD operations.
 * Provides optimistic updates, error handling, and cache invalidation for language management.
 *
 * @module hooks/mutations/useLanguageMutations
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminLanguageApi } from '../../api/admin/language.api';
import { ICreateLanguageRequest, IUpdateLanguageRequest } from '../../types/requests/admin/languages.types';
import { ILanguage } from '../../types/responses/admin/languages.types';
import { parseApiError } from '../../utils/mutation-error-handler';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';

interface ILanguageMutationOptions {
    onSuccess?: (data: ILanguage) => void;
    onError?: (error: any) => void;
    showNotifications?: boolean;
}

interface IDeleteLanguageMutationOptions {
    onSuccess?: () => void;
    onError?: (error: any) => void;
    showNotifications?: boolean;
}

/**
 * React Query mutation hook for creating languages
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useCreateLanguageMutation(options: ILanguageMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: (languageData: ICreateLanguageRequest) => AdminLanguageApi.createLanguage(languageData),

        onSuccess: async (createdLanguage: ILanguage) => {
            // Invalidate and refetch language queries
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.LANGUAGES }),
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PUBLIC_LANGUAGES }),
                queryClient.refetchQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.LANGUAGES }),
                queryClient.refetchQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PUBLIC_LANGUAGES }),
            ]);

            if (showNotifications) {
                notifications.show({
                    title: 'Language Created Successfully',
                    message: `Language "${createdLanguage.language}" (${createdLanguage.locale}) was created successfully!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }

            // Call custom success handler if provided
            onSuccess?.(createdLanguage);
        },

        onError: (error: any) => {
            // Use centralized error parsing
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

            // Call custom error handler if provided
            onError?.(error);
        },
    });
}

/**
 * React Query mutation hook for updating languages
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useUpdateLanguageMutation(options: ILanguageMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: ({ languageId, languageData }: { languageId: number; languageData: IUpdateLanguageRequest }) =>
            AdminLanguageApi.updateLanguage(languageId, languageData),

        onSuccess: async (updatedLanguage: ILanguage) => {
            // Invalidate and refetch language queries
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.LANGUAGES }),
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PUBLIC_LANGUAGES }),
                queryClient.refetchQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.LANGUAGES }),
                queryClient.refetchQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PUBLIC_LANGUAGES }),
            ]);

            if (showNotifications) {
                notifications.show({
                    title: 'Language Updated Successfully',
                    message: `Language "${updatedLanguage.language}" (${updatedLanguage.locale}) was updated successfully!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }

            // Call custom success handler if provided
            onSuccess?.(updatedLanguage);
        },

        onError: (error: any) => {
            // Use centralized error parsing
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

            // Call custom error handler if provided
            onError?.(error);
        },
    });
}

/**
 * React Query mutation hook for deleting languages
 * @param options Configuration options for the mutation
 * @returns useMutation result with enhanced error handling and notifications
 */
export function useDeleteLanguageMutation(options: IDeleteLanguageMutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: (languageId: number) => AdminLanguageApi.deleteLanguage(languageId),

        onSuccess: async () => {
            // Invalidate and refetch language queries
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.LANGUAGES }),
                queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PUBLIC_LANGUAGES }),
                queryClient.refetchQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.LANGUAGES }),
                queryClient.refetchQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PUBLIC_LANGUAGES }),
            ]);

            if (showNotifications) {
                notifications.show({
                    title: 'Language Deleted Successfully',
                    message: 'Language was deleted successfully!',
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }

            // Call custom success handler if provided
            onSuccess?.();
        },

        onError: (error: any) => {
            // Use centralized error parsing
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

            // Call custom error handler if provided
            onError?.(error);
        },
    });
}
