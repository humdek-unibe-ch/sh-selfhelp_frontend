/**
 * Page Version Mutations
 * React Query mutations for page versioning operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageVersionApi } from '../../api/admin/page-version.api';
import { notifications } from '@mantine/notifications';
import { IPublishVersionRequest } from '../../types/requests/admin/page-version.types';
import { debug } from '../../utils/debug-logger';

export function usePublishVersionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ pageId, data }: { pageId: number; data?: IPublishVersionRequest }) =>
            PageVersionApi.publishNewVersion(pageId, data),
        onSuccess: (_, variables) => {
            debug('Version published successfully', 'usePublishVersionMutation', { pageId: variables.pageId });
            
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['page-versions', variables.pageId] });
            queryClient.invalidateQueries({ queryKey: ['page-details', variables.pageId] });
            queryClient.invalidateQueries({ queryKey: ['adminPages'] });
            
            notifications.show({
                title: 'Version Published',
                message: 'Page version published successfully',
                color: 'green',
            });
        },
        onError: (error: any) => {
            debug('Failed to publish version', 'usePublishVersionMutation', { error }, 'error');
            notifications.show({
                title: 'Publish Failed',
                message: error.response?.data?.message || 'Failed to publish version',
                color: 'red',
            });
        },
    });
}

export function usePublishSpecificVersionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ pageId, versionId }: { pageId: number; versionId: number }) =>
            PageVersionApi.publishSpecificVersion(pageId, versionId),
        onSuccess: (_, variables) => {
            debug('Specific version published', 'usePublishSpecificVersionMutation', variables);
            
            queryClient.invalidateQueries({ queryKey: ['page-versions', variables.pageId] });
            queryClient.invalidateQueries({ queryKey: ['page-details', variables.pageId] });
            queryClient.invalidateQueries({ queryKey: ['adminPages'] });
            
            notifications.show({
                title: 'Version Published',
                message: 'Selected version published successfully',
                color: 'green',
            });
        },
        onError: (error: any) => {
            debug('Failed to publish specific version', 'usePublishSpecificVersionMutation', { error }, 'error');
            notifications.show({
                title: 'Publish Failed',
                message: error.response?.data?.message || 'Failed to publish version',
                color: 'red',
            });
        },
    });
}

export function useUnpublishPageMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (pageId: number) => PageVersionApi.unpublishPage(pageId),
        onSuccess: (_, pageId) => {
            debug('Page unpublished', 'useUnpublishPageMutation', { pageId });
            
            queryClient.invalidateQueries({ queryKey: ['page-versions', pageId] });
            queryClient.invalidateQueries({ queryKey: ['page-details', pageId] });
            queryClient.invalidateQueries({ queryKey: ['adminPages'] });
            
            notifications.show({
                title: 'Page Unpublished',
                message: 'Page reverted to draft mode',
                color: 'blue',
            });
        },
        onError: (error: any) => {
            debug('Failed to unpublish page', 'useUnpublishPageMutation', { error }, 'error');
            notifications.show({
                title: 'Unpublish Failed',
                message: error.response?.data?.message || 'Failed to unpublish page',
                color: 'red',
            });
        },
    });
}

export function useDeleteVersionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ pageId, versionId }: { pageId: number; versionId: number }) =>
            PageVersionApi.deleteVersion(pageId, versionId),
        onSuccess: (_, variables) => {
            debug('Version deleted', 'useDeleteVersionMutation', variables);
            
            queryClient.invalidateQueries({ queryKey: ['page-versions', variables.pageId] });
            
            notifications.show({
                title: 'Version Deleted',
                message: 'Page version deleted successfully',
                color: 'green',
            });
        },
        onError: (error: any) => {
            debug('Failed to delete version', 'useDeleteVersionMutation', { error }, 'error');
            notifications.show({
                title: 'Delete Failed',
                message: error.response?.data?.message || 'Failed to delete version',
                color: 'red',
            });
        },
    });
}

