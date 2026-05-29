/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { AdminRegistrationCodesApi } from '../api/admin/registration-codes.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import type { ICreateRegistrationCodeRequest } from '../types/requests/admin/registration-codes.types';

const QUERY_KEY = ['registration-codes'] as const;

export function useRegistrationCodes() {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => AdminRegistrationCodesApi.getAll(),
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
    });
}

export function useCreateRegistrationCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ICreateRegistrationCodeRequest) => AdminRegistrationCodesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            notifications.show({
                title: 'Success',
                message: 'Registration code created successfully',
                color: 'green',
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: 'Error',
                message: error?.response?.data?.message || 'Failed to create registration code',
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
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
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
