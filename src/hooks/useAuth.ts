'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../config/routes.config';
import { useAuthUser } from './useUserData';
import { IMPERSONATE_TARGET_EMAIL_COOKIE, IMPERSONATE_COOKIE } from '../config/cookie-names';
import { readCookieValue, writeBrowserCookie } from '../utils/auth.utils';

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

    const isImpersonating = useMemo(() => !!readCookieValue(IMPERSONATE_COOKIE), []);

    const targetUser = useMemo(() => {
      if (!isImpersonating) return null;
      const email = readCookieValue(IMPERSONATE_TARGET_EMAIL_COOKIE);
      return email ? { email } : null;
    }, []);

    const stopImpersonation = useCallback(() => {
      writeBrowserCookie(IMPERSONATE_COOKIE, '', 0);
      writeBrowserCookie(IMPERSONATE_TARGET_EMAIL_COOKIE, '', 0);
      globalThis.location.reload();
    }, []);

    // For cases where the cookie is not valid but the user didnt change page, this in order to update banner.
    useEffect(() => {
        if (!isImpersonating) return;

        const interval = setInterval(() => {
            const stillActive = !!readCookieValue(IMPERSONATE_COOKIE);
            if (!stillActive) {
                // Cookie expired — clean up and reload
                stopImpersonation();
            }
        }, 10000); // check every 10 seconds

        return () => clearInterval(interval);
    }, [isImpersonating, stopImpersonation]);

    return useMemo(
        () => ({
            isAuthenticated,
            isLoading,
            user,
            permissionChecker,
            hasPermission,
            hasAdminAccess,
            requireAdminAccess,
            isImpersonating,
            targetUser,
            stopImpersonation
        }),
        [
            isAuthenticated,
            isLoading,
            user,
            permissionChecker,
            hasPermission,
            hasAdminAccess,
            requireAdminAccess,
            isImpersonating,
            targetUser,
            stopImpersonation
        ]
    );
};
