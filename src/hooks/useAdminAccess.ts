/**
 * Custom hook for checking admin access.
 * Provides functionality to verify if the current user has admin privileges.
 * Works in conjunction with middleware to protect admin routes.
 * 
 * @module hooks/useAdminAccess
 */

import { useGo, useIsAuthenticated } from '@refinedev/core';
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
    const go = useGo();
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
                go({ to: ROUTES.LOGIN, type: "replace" });
            } else if (!hasAccess) {
                // Logged in but doesn't have admin access
                go({ to: ROUTES.NO_ACCESS, type: "replace" });
            }
        }
    }, [isLoading, hasAccess, isAuthenticated, go]);

    return {
        hasAccess,
        isLoading,
    };
}
