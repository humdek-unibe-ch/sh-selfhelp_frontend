/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../config/routes.config';
import { useAuthUser } from './useUserData';
import {
    bootImpersonationStore,
    useImpersonationStore,
} from '../app/store/impersonation.store';

/**
 * Convenience hook bundling auth + permission helpers around a single
 * `useUserData` subscription. Components that only need a slice should
 * call `useAuthUser` directly to avoid pulling unrelated dependencies.
 *
 * The hook also exposes the live impersonation state (`isImpersonating`,
 * `targetEmail`) — see `app/store/impersonation.store.ts` for the
 * single source of truth.
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

    // Boot the impersonation store exactly once per browser session.
    // It re-reads the email cookie on visibilitychange + a 5s poll, so
    // every component that subscribes via `useImpersonationStore` is
    // automatically reactive without per-component intervals.
    useEffect(() => {
        bootImpersonationStore();
    }, []);

    const isImpersonating = useImpersonationStore((s) => s.isImpersonating);
    const targetEmail = useImpersonationStore((s) => s.targetEmail);
    const targetUser = useMemo(
        () => (targetEmail ? { email: targetEmail } : null),
        [targetEmail]
    );

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
        ]
    );
};
