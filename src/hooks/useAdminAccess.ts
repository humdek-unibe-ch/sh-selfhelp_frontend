/**
 * Custom hook for checking admin access.
 * Provides functionality to verify if the current user has admin privileges.
 * Works in conjunction with middleware to protect admin routes.
 * 
 * @module hooks/useAdminAccess
 */

import { useNavigation, useIsAuthenticated } from '@refinedev/core';
import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useHasPermission } from './useUserData';
import { PERMISSIONS } from '../types/auth/jwt-payload.types';
import { ROUTES } from '../config/routes.config';

/**
 * Hook for checking admin access and handling unauthorized access
 * @returns Object containing admin access status and query state
 */
export function useAdminAccess() {
    const { replace } = useNavigation();
    const { isLoading: isAuthLoading } = useIsAuthenticated();
    const { isAuthenticated, isLoading: isUserDataLoading } = useAuth();
    const hasPermission = useHasPermission();

    // Check user data for admin.access permission
    const hasAccess = hasPermission(PERMISSIONS.ADMIN_ACCESS);
    const isLoading = isAuthLoading || isUserDataLoading;

    // Handle unauthorized access
    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                // Not logged in at all
                replace(ROUTES.LOGIN);
            } else if (!hasAccess) {
                // Logged in but doesn't have admin access
                replace(ROUTES.NO_ACCESS);
            }
        }
    }, [isLoading, hasAccess, isAuthenticated, replace]);

    return {
        hasAccess,
        isLoading,
    };
}
