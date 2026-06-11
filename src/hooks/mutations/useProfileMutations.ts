/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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
            queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });
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
            queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });
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
 * Mutation hook for updating user timezone preference
 *
 * Updates the user's timezone setting which affects how dates and times
 * are displayed throughout the application. The timezone is stored as
 * a lookup ID referencing the timezones lookup table.
 *
 * @returns Mutation hook with timezone update functionality
 *
 * @example
 * ```typescript
 * const updateTimezone = useUpdateTimezoneMutation();
 *
 * // Update to UTC timezone
 * updateTimezone.mutate({ timezoneId: 1 });
 * ```
 *
 * @note Invalidates user data cache on success to refresh timezone info
 * @note Timezone changes affect date/time display across the entire application
 */
export function useUpdateTimezoneMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ timezoneId }: { timezoneId: number }) => {
            return AuthApi.updateTimezone(timezoneId);
        },
        onSuccess: () => {
            // Invalidate and refetch user data to update timezone info
            queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });
        },
        ...REACT_QUERY_CONFIG.DEFAULT_OPTIONS.mutations
    });
}

/**
 * Mutation hook for updating the user's communication preferences (issue #29).
 *
 * Persists whether the backend may send the user scheduled notifications and
 * (non-system) emails. Invalidates user data on success so the toggles and any
 * dependent UI reflect the saved state.
 */
export function useUpdateCommunicationPreferencesMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            receivesNotifications,
            receivesEmails,
        }: {
            receivesNotifications: boolean;
            receivesEmails: boolean;
        }) => {
            return AuthApi.updateCommunicationPreferences(receivesNotifications, receivesEmails);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });
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
