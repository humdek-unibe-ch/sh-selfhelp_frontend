import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserInputApi } from '../api/user-input.api';
import { IUserInputFilters } from '../types/responses/admin/user-input.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { notifications } from '@mantine/notifications';
import { debug } from '../utils/debug-logger';

/**
 * Hook to fetch user input entries with filtering and pagination
 */
export function useUserInputEntries(filters: IUserInputFilters = {}) {
    return useQuery({
        queryKey: ['userInputEntries', filters],
        queryFn: () => UserInputApi.getUserInputEntries(filters),
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        retry: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retry,
        retryDelay: REACT_QUERY_CONFIG.DEFAULT_OPTIONS.queries.retryDelay,
        enabled: true,
    });
}

/**
 * Hook to delete a user input entry
 */
export function useDeleteUserInputEntryMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (entryId: number) => UserInputApi.deleteUserInputEntry(entryId),
        onSuccess: (data, entryId) => {
            debug('User input entry deleted successfully', 'useDeleteUserInputEntryMutation', {
                entryId,
                success: data.data?.success
            });

            notifications.show({
                title: 'Entry Deleted',
                message: `Entry ${entryId} has been deleted successfully`,
                color: 'green',
            });

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['userInputEntries'] });
        },
        onError: (error, entryId) => {
            debug('Failed to delete user input entry', 'useDeleteUserInputEntryMutation', {
                entryId,
                error
            });

            notifications.show({
                title: 'Deletion Failed',
                message: `Failed to delete entry ${entryId}`,
                color: 'red',
            });
        },
    });
} 