/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * React Query hooks for first-class CMS apps.
 *
 * @module hooks/useCmsApps
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import React from 'react';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AdminCmsAppApi } from '../api/admin/cms-app.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { parseApiError } from '../utils/mutation-error-handler';
import {
    type IAssignCmsAppPageRequest,
    type IChangeCmsAppPageRoleRequest,
    type ICreateCmsAppShellRequest,
    type IScaffoldCmsAppRequest,
    type IUpdateCmsAppRequest,
} from '../types/requests/admin/cms-app.types';

async function invalidateCmsAppCaches(queryClient: ReturnType<typeof useQueryClient>) {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_CMS_APPS }),
        queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES }),
    ]);
}

function showError(error: unknown) {
    const { errorMessage, errorTitle } = parseApiError(error);
    notifications.show({
        title: errorTitle,
        message: errorMessage,
        icon: React.createElement(IconX, { size: '1rem' }),
        color: 'red',
        autoClose: 8000,
        position: 'top-center',
    });
}

export function useCmsAppsQuery(enabled = true) {
    return useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_CMS_APPS,
        queryFn: () => AdminCmsAppApi.list(),
        enabled,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.ADMIN_PAGES.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.ADMIN_PAGES.gcTime,
    });
}

export function useCmsAppBySlugQuery(slug: string | undefined, enabled = true) {
    return useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_CMS_APP_BY_SLUG(slug ?? ''),
        queryFn: () => AdminCmsAppApi.getBySlug(slug as string),
        enabled: Boolean(slug) && enabled,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.ADMIN_PAGES.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.ADMIN_PAGES.gcTime,
    });
}

export function useCreateCmsAppShellMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: ICreateCmsAppShellRequest) => AdminCmsAppApi.create(payload),
        onSuccess: async () => {
            await invalidateCmsAppCaches(queryClient);
            notifications.show({
                title: 'CMS app created',
                message: 'Empty app shell ready — assign pages or scaffold.',
                icon: React.createElement(IconCheck, { size: '1rem' }),
                color: 'green',
                autoClose: 4000,
                position: 'top-center',
            });
        },
        onError: showError,
    });
}

export function useUpdateCmsAppMutation(appId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: IUpdateCmsAppRequest) => AdminCmsAppApi.update(appId, payload),
        onSuccess: async (data) => {
            await invalidateCmsAppCaches(queryClient);
            await queryClient.invalidateQueries({
                queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_CMS_APP_BY_SLUG(data.slug),
            });
        },
        onError: showError,
    });
}

export function useDeleteCmsAppMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => AdminCmsAppApi.remove(id),
        onSuccess: async () => {
            await invalidateCmsAppCaches(queryClient);
            notifications.show({
                title: 'CMS app removed',
                message: 'App shell deleted. Pages and records were kept.',
                icon: React.createElement(IconCheck, { size: '1rem' }),
                color: 'green',
                autoClose: 5000,
                position: 'top-center',
            });
        },
        onError: showError,
    });
}

export function useAssignCmsAppPageMutation(appId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: IAssignCmsAppPageRequest) => AdminCmsAppApi.assignPage(appId, payload),
        onSuccess: async () => {
            await invalidateCmsAppCaches(queryClient);
        },
        onError: showError,
    });
}

export function useChangeCmsAppPageRoleMutation(appId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ pageId, role }: { pageId: number; role: IChangeCmsAppPageRoleRequest['role'] }) =>
            AdminCmsAppApi.changePageRole(appId, pageId, { role }),
        onSuccess: async () => {
            await invalidateCmsAppCaches(queryClient);
        },
        onError: showError,
    });
}

export function useUnassignCmsAppPageMutation(appId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (pageId: number) => AdminCmsAppApi.unassignPage(appId, pageId),
        onSuccess: async () => {
            await invalidateCmsAppCaches(queryClient);
        },
        onError: showError,
    });
}

export function useScaffoldCmsAppMutation(appId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: IScaffoldCmsAppRequest) => AdminCmsAppApi.scaffold(appId, payload),
        onSuccess: async (result) => {
            await invalidateCmsAppCaches(queryClient);
            notifications.show({
                title: 'Pages scaffolded',
                message: `Created ${result.created.length} page(s) for this CMS app.`,
                icon: React.createElement(IconCheck, { size: '1rem' }),
                color: 'green',
                autoClose: 5000,
                position: 'top-center',
            });
        },
        onError: showError,
    });
}
