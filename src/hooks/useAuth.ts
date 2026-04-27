'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../config/routes.config';
import { useAuthUser } from './useUserData';

/**
 * Convenience hook bundling auth + permission helpers around a single
 * `useUserData` subscription. Components that only need a slice should call
 * `useAuthUser` directly to avoid pulling unrelated dependencies.
 */
export const useAuth = () => {
    const router = useRouter();
    const { user, permissionChecker, isLoading } = useAuthUser();
    const isAuthenticated = user !== null;

    const hasPermission = useCallback(
        (permission: string): boolean =>
            !!user?.permissions?.includes(permission),
        [user]
    );

    const hasAdminAccess = useCallback(
        (): boolean => hasPermission('admin.access'),
        [hasPermission]
    );

    const requireAdminAccess = useCallback((): boolean => {
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

    return useMemo(
        () => ({
            isAuthenticated,
            isLoading,
            user,
            permissionChecker,
            hasPermission,
            hasAdminAccess,
            requireAdminAccess,
        }),
        [
            isAuthenticated,
            isLoading,
            user,
            permissionChecker,
            hasPermission,
            hasAdminAccess,
            requireAdminAccess,
        ]
    );
};
