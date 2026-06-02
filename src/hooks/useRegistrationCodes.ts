/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { AdminRegistrationCodesApi } from '../api/admin/registration-codes.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import type {
    ICreateRegistrationCodeRequest,
    IGenerateRegistrationCodesRequest,
} from '../types/requests/admin/registration-codes.types';
import type { IRegistrationCodesListParams } from '../types/responses/admin/registration-codes.types';

const QUERY_KEYS = {
    all: ['registration-codes'] as const,
    list: (params: IRegistrationCodesListParams) => ['registration-codes', 'list', params] as const,
};

export function useRegistrationCodes(params: IRegistrationCodesListParams = {}) {
    return useQuery({
        queryKey: QUERY_KEYS.list(params),
        queryFn: () => AdminRegistrationCodesApi.getAll(params),
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
    });
}

export function useCreateRegistrationCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ICreateRegistrationCodeRequest) => AdminRegistrationCodesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
            notifications.show({
                title: 'Success',
                message: 'Registration code created successfully',
                color: 'green',
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: 'Error',
                message: error?.response?.data?.error || error?.response?.data?.message || 'Failed to create registration code',
                color: 'red',
            });
        },
    });
}

export function useDeleteRegistrationCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (code: string) => AdminRegistrationCodesApi.delete(code),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
            notifications.show({
                title: 'Success',
                message: 'Registration code deleted successfully',
                color: 'green',
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: 'Error',
                message: error?.response?.data?.message || 'Failed to delete registration code',
                color: 'red',
            });
        },
    });
}

export function useExportRegistrationCodes() {
    return useMutation({
        mutationFn: (params: Parameters<typeof AdminRegistrationCodesApi.exportCsv>[0]) =>
            AdminRegistrationCodesApi.exportCsv(params),
        onError: (error: any) => {
            notifications.show({
                title: 'Export Failed',
                message: error?.response?.data?.message || 'Failed to export registration codes',
                color: 'red',
            });
        },
    });
}

export function useGenerateRegistrationCodes() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: IGenerateRegistrationCodesRequest) => AdminRegistrationCodesApi.generate(data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
            notifications.show({
                title: 'Success',
                message: `${result.codes.length} registration code${result.codes.length !== 1 ? 's' : ''} generated successfully`,
                color: 'green',
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: 'Error',
                message: error?.response?.data?.error || error?.response?.data?.message || 'Failed to generate registration codes',
                color: 'red',
            });
        },
    });
}
