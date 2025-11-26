'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthApi } from '../../api/auth.api';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';

/**
 * Mutation hook for updating user username
 */
export function useUpdateUsernameMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ newUsername }: { newUsername: string }) => {
            return AuthApi.updateUsername(newUsername);
        },
        onSuccess: () => {
            // Invalidate and refetch user data
            queryClient.invalidateQueries({ queryKey: ['auth', 'user-data'] });
        },
        ...REACT_QUERY_CONFIG.DEFAULT_OPTIONS.mutations
    });
}

/**
 * Mutation hook for updating user display name
 */
export function useUpdateNameMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ newName }: { newName: string }) => {
            return AuthApi.updateName(newName);
        },
        onSuccess: () => {
            // Invalidate and refetch user data
            queryClient.invalidateQueries({ queryKey: ['auth', 'user-data'] });
        },
        ...REACT_QUERY_CONFIG.DEFAULT_OPTIONS.mutations
    });
}

/**
 * Mutation hook for updating user password
 */
export function useUpdatePasswordMutation() {
    return useMutation({
        mutationFn: async ({
            currentPassword,
            newPassword
        }: {
            currentPassword: string;
            newPassword: string;
        }) => {
            return AuthApi.updatePassword(currentPassword, newPassword);
        },
        ...REACT_QUERY_CONFIG.DEFAULT_OPTIONS.mutations
    });
}

/**
 * Mutation hook for updating user timezone
 */
export function useUpdateTimezoneMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ timezoneId }: { timezoneId: number }) => {
            return AuthApi.updateTimezone(timezoneId);
        },
        onSuccess: () => {
            // Invalidate and refetch user data
            queryClient.invalidateQueries({ queryKey: ['auth', 'user-data'] });
        },
        ...REACT_QUERY_CONFIG.DEFAULT_OPTIONS.mutations
    });
}

/**
 * Mutation hook for deleting user account
 */
export function useDeleteAccountMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ emailConfirmation }: { emailConfirmation: string }) => {
            return AuthApi.deleteAccount(emailConfirmation);
        },
        onSuccess: () => {
            // Clear all cached data since user is deleted
            queryClient.clear();
        },
        ...REACT_QUERY_CONFIG.DEFAULT_OPTIONS.mutations
    });
}
