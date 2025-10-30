'use client';

import { useCallback } from 'react';
import { useIsAuthenticated } from '@refinedev/core';
import { useRouter } from 'next/navigation';
import { PERMISSIONS } from '../types/auth/jwt-payload.types';
import { ROUTES } from '../config/routes.config';
import { useAuthUser, useHasPermission, useHasAdminAccess } from './useUserData';

/**
 * Hook to access authentication state, user data, and permission checking
 * Updated to use new user data endpoint instead of JWT-based user info
 * 
 * @returns Authentication utilities and user data
 */
export const useAuth = () => {
    const router = useRouter();
    const { data: isAuthenticated, isLoading: isAuthLoading } = useIsAuthenticated();
    const { user, permissionChecker, isLoading: isUserDataLoading } = useAuthUser();
    const hasPermission = useHasPermission();
    const hasAdminAccess = useHasAdminAccess();

    // Combined loading state
    const isLoading = isAuthLoading || isUserDataLoading;

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
        permissionChecker,
        hasPermission,
        hasAdminAccess,
        requireAdminAccess,
    };
};
