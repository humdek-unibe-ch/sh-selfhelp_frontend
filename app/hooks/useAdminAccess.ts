/**
 * Custom hook for checking admin access.
 * Provides functionality to verify if the current user has admin privileges.
 * Works in conjunction with middleware to protect admin routes.
 * 
 * @module hooks/useAdminAccess
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigation, useAuthenticated } from '@refinedev/core';
import { AdminApi } from '@/api/admin.api';
import { useEffect } from 'react';

/**
 * Hook for checking admin access and handling unauthorized access
 * @returns Object containing admin access status and query state
 */
export function useAdminAccess() {
    const { replace } = useNavigation();
    const { isLoading: isAuthLoading } = useAuthenticated();

    const { data, isLoading: isAccessLoading, error } = useQuery({
        queryKey: ['adminAccess'],
        queryFn: async () => {
            const response = await AdminApi.getAdminAccess();
            return response;
        },
        staleTime: 1000, // 1 second
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        retry: 1,
        enabled: !isAuthLoading // Only check access for admin routes
    });

    const isLoading = isAuthLoading || isAccessLoading;
    const hasAccess = data?.access || false;

    // Handle unauthorized access
    useEffect(() => {
        if (!isLoading && !hasAccess) {
            replace('/auth/login');
        }
    }, [isLoading, hasAccess, replace]);

    return {
        hasAccess,
        isLoading,
        error
    };
}
