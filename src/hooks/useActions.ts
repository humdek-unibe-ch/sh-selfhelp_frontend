import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminActionApi } from '../api/admin/action.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import type { IActionsListParams, IActionsListResponse, IActionDetails } from '../types/responses/admin/actions.types';
import type { ICreateActionRequest, IUpdateActionRequest } from '../types/requests/admin/actions.types';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import React from 'react';

export const ACTION_QUERY_KEYS = {
    all: ['actions'] as const,
    lists: () => [...ACTION_QUERY_KEYS.all, 'list'] as const,
    list: (params: IActionsListParams) => [...ACTION_QUERY_KEYS.lists(), params] as const,
    details: () => [...ACTION_QUERY_KEYS.all, 'detail'] as const,
    detail: (id: number) => [...ACTION_QUERY_KEYS.details(), id] as const,
};

function getErrorMessage(err: unknown, fallback: string) {
    if (err && typeof err === 'object') {
        // axios-style error.message or error.response.data.message, etc.
        const anyErr = err as { message?: string; response?: { data?: { message?: string } } };
        return anyErr.response?.data?.message ?? anyErr.message ?? fallback;
    }
    return fallback;
}

export function useActions(params: IActionsListParams = {}) {
    return useQuery<IActionsListResponse>({
        queryKey: ACTION_QUERY_KEYS.list(params),
        queryFn: () => AdminActionApi.getActions(params),
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        // identity; keeps API shape
        select: (data) => data,
    });
}

export function useActionDetails(actionId: number) {
    return useQuery<IActionDetails>({
        queryKey: ACTION_QUERY_KEYS.detail(actionId),
        queryFn: () => AdminActionApi.getActionById(actionId),
        enabled: !!actionId, // assumes IDs are positive
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    });
}

export function useCreateAction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: ICreateActionRequest) => AdminActionApi.createAction(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ACTION_QUERY_KEYS.all });
            notifications.show({
                title: 'Action created',
                message: 'The action was created successfully.',
                color: 'green',
                icon: React.createElement(IconCheck, { size: 16 }),
            });
        },
        onError: (err: unknown) => {
            notifications.show({
                title: 'Create failed',
                message: getErrorMessage(err, 'Failed to create action'),
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
            });
        },
    });
}

export function useUpdateAction(actionId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: IUpdateActionRequest) => AdminActionApi.updateAction(actionId, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ACTION_QUERY_KEYS.all });
            notifications.show({
                title: 'Action updated',
                message: 'The action was updated successfully.',
                color: 'green',
                icon: React.createElement(IconCheck, { size: 16 }),
            });
        },
        onError: (err: unknown) => {
            notifications.show({
                title: 'Update failed',
                message: getErrorMessage(err, 'Failed to update action'),
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
            });
        },
    });
}

export function useDeleteAction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (actionId: number) => AdminActionApi.deleteAction(actionId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ACTION_QUERY_KEYS.all });
            notifications.show({
                title: 'Action deleted',
                message: 'The action was deleted.',
                color: 'green',
                icon: React.createElement(IconCheck, { size: 16 }),
            });
        },
        onError: (err: unknown) => {
            notifications.show({
                title: 'Delete failed',
                message: getErrorMessage(err, 'Failed to delete action'),
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
            });
        },
    });
}
