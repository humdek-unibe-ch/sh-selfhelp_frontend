/**
 * Page Version Mutations
 * React Query mutations for page versioning operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageVersionApi } from '../../api/admin/page-version.api';
import { AdminPageApi } from '../../api/admin/page.api';
import { notifications } from '@mantine/notifications';
import { IPublishVersionRequest } from '../../types/requests/admin/page-version.types';
import { debug } from '../../utils/debug-logger';

export function usePublishVersionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ pageId, data }: { pageId: number; data?: IPublishVersionRequest }) =>
            PageVersionApi.publishNewVersion(pageId, data),
        onSuccess: async (_, variables) => {
            debug('Version published successfully', 'usePublishVersionMutation', { pageId: variables.pageId });

            // Invalidate and refetch relevant queries to ensure fresh data
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['page-versions', variables.pageId] }),
                queryClient.invalidateQueries({ queryKey: ['unpublished-changes', variables.pageId] }),
                queryClient.invalidateQueries({ queryKey: ['page-details', variables.pageId] }),
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
            ]);

            // Force immediate refetch of version data
            await queryClient.refetchQueries({ queryKey: ['page-versions', variables.pageId] });
            
            notifications.show({
                title: 'Version Published',
                message: 'Page version published successfully',
                color: 'green',
            });
        },
        onError: (error: any) => {
            debug('Failed to publish version', 'usePublishVersionMutation', { error });
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
        onSuccess: async (_, variables) => {
            debug('Specific version published', 'usePublishSpecificVersionMutation', variables);
            
            // Invalidate and refetch relevant queries to ensure fresh data
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['page-versions', variables.pageId] }),
                queryClient.invalidateQueries({ queryKey: ['page-details', variables.pageId] }),
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
            ]);
            
            // Force immediate refetch of version data
            await queryClient.refetchQueries({ queryKey: ['page-versions', variables.pageId] });
            
            notifications.show({
                title: 'Version Published',
                message: 'Selected version published successfully',
                color: 'green',
            });
        },
        onError: (error: any) => {
            debug('Failed to publish specific version', 'usePublishSpecificVersionMutation', { error });
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
        onSuccess: async (_, pageId) => {
            debug('Page unpublished', 'useUnpublishPageMutation', { pageId });
            
            // Invalidate and refetch relevant queries to ensure fresh data
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['page-versions', pageId] }),
                queryClient.invalidateQueries({ queryKey: ['page-details', pageId] }),
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
            ]);
            
            // Force immediate refetch of version data
            await queryClient.refetchQueries({ queryKey: ['page-versions', pageId] });
            
            notifications.show({
                title: 'Page Unpublished',
                message: 'Page reverted to draft mode',
                color: 'blue',
            });
        },
        onError: (error: any) => {
            debug('Failed to unpublish page', 'useUnpublishPageMutation', { error });
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
            queryClient.invalidateQueries({ queryKey: ['unpublished-changes', variables.pageId] });

            notifications.show({
                title: 'Version Deleted',
                message: 'Page version deleted successfully',
                color: 'green',
            });
        },
        onError: (error: any) => {
            debug('Failed to delete version', 'useDeleteVersionMutation', { error });
            notifications.show({
                title: 'Delete Failed',
                message: error.response?.data?.message || 'Failed to delete version',
                color: 'red',
            });
        },
    });
}

export function useRestoreFromVersionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ pageId, versionId }: { pageId: number; versionId: number }) =>
            AdminPageApi.restoreFromVersion(pageId, versionId),
        onSuccess: async (response, variables) => {
            debug('Sections restored from version', 'useRestoreFromVersionMutation', {
                pageId: variables.pageId,
                versionId: variables.versionId,
                sectionsRestored: response.data.sections_restored
            });

            // Invalidate and refetch relevant queries to ensure fresh data
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['page-versions', variables.pageId] }),
                queryClient.invalidateQueries({ queryKey: ['unpublished-changes', variables.pageId] }),
                queryClient.invalidateQueries({ queryKey: ['page-details', variables.pageId] }),
                queryClient.invalidateQueries({ queryKey: ['pageSections', variables.pageId] }),
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
            ]);

            // Force immediate refetch of page data
            await queryClient.refetchQueries({ queryKey: ['page-details', variables.pageId] });
            await queryClient.refetchQueries({ queryKey: ['pageSections', variables.pageId] });

            notifications.show({
                title: 'Sections Restored',
                message: `Successfully restored ${response.data.sections_restored} sections from version "${response.data.version_restored_from.version_name || `v${response.data.version_restored_from.version_number}`}"`,
                color: 'green',
            });
        },
        onError: (error: any) => {
            debug('Failed to restore from version', 'useRestoreFromVersionMutation', { error });
            notifications.show({
                title: 'Restore Failed',
                message: error.response?.data?.message || 'Failed to restore sections from version',
                color: 'red',
            });
        },
    });
}

