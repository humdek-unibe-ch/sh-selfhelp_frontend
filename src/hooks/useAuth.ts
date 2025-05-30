'use client';

import { useCallback, useMemo } from 'react';
import { useIsAuthenticated, useGetIdentity } from '@refinedev/core';
import { useRouter } from 'next/navigation';
import { IAuthUser, PERMISSIONS } from '../types/auth/jwt-payload.types';
import { getUserPayload, getCurrentUser, hasPermission as checkPermission } from '../utils/auth.utils';
import { ROUTES } from '../config/routes.config';

/**
 * Hook to access authentication state, user data, and permission checking
 * 
 * @returns Authentication utilities and user data
 */
export const useAuth = () => {
    const router = useRouter();
    const { data: isAuthenticated, isLoading: isAuthLoading } = useIsAuthenticated();
    const { data: identity, isLoading: isIdentityLoading } = useGetIdentity<{ token: string }>();
    
    // Combined loading state
    const isLoading = isAuthLoading || isIdentityLoading;

    // Get user information from token
    const user = useMemo<IAuthUser | null>(() => {
        if (!isAuthenticated) return null;

        // If we have identity from Refine, use that token
        if (identity?.token) {
            return getUserPayload(identity.token);
        }

        // Otherwise fallback to token in localStorage
        return getCurrentUser();
    }, [isAuthenticated, identity]);

    /**
     * Check if user has a specific permission
     */
    const hasPermission = useCallback((permission: string): boolean => {
        return checkPermission(permission, user);
    }, [user]);

    /**
     * Check if user has admin access
     */
    const hasAdminAccess = useCallback((): boolean => {
        return hasPermission(PERMISSIONS.ADMIN_ACCESS);
    }, [hasPermission]);

    /**
     * Redirect to no access page if user doesn't have admin access
     */
    const requireAdminAccess = useCallback(() => {
        if (!isAuthenticated) {
            router.push(ROUTES.LOGIN);
            return false;
        }

        if (!hasAdminAccess()) {
            router.push(ROUTES.NO_ACCESS);
            return false;
        }

        return true;
    }, [isAuthenticated, hasAdminAccess, router]);

    return {
        isAuthenticated,
        isLoading,
        user,
        hasPermission,
        hasAdminAccess,
        requireAdminAccess,
    };
};
