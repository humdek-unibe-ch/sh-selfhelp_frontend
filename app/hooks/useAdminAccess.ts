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
import { PERMISSIONS } from '../types/auth/jwt-payload.types';
import { ROUTES } from '@/config/routes.config';

/**
 * Hook for checking admin access and handling unauthorized access
 * @returns Object containing admin access status and query state
 */
export function useAdminAccess() {
    const { replace } = useNavigation();
    const { isLoading: isAuthLoading } = useIsAuthenticated();
    const { user, isAuthenticated } = useAuth();

    // Check JWT token for admin.access permission
    const hasAccess = user?.permissions?.includes(PERMISSIONS.ADMIN_ACCESS) || false;

    // Handle unauthorized access
    useEffect(() => {
        if (!isAuthLoading) {
            if (!isAuthenticated) {
                // Not logged in at all
                replace(ROUTES.LOGIN);
            } else if (!hasAccess) {
                // Logged in but doesn't have admin access
                replace(ROUTES.NO_ACCESS);
            }
        }
    }, [isAuthLoading, hasAccess, isAuthenticated, replace]);

    return {
        hasAccess,
        isLoading: isAuthLoading,
    };
}
