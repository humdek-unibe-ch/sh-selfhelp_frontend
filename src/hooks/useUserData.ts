/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AuthApi } from '../api/auth.api';
import { IUserDataResponse, IAuthUser, IUserData } from '../types/auth/jwt-payload.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { createPermissionChecker, PermissionChecker } from '../utils/permissions.utils';
import { permissionManager } from '../api/permission-wrapper.api';
import { isTransientApiError, transientRetryDelay } from '../utils/transient-error.utils';

/**
 * How many times the user-data probe is retried while the backend is briefly
 * unavailable (a manager-driven service restart during a plugin/system
 * operation). Long enough to cover a typical restart window so the operator's
 * auth state never flickers to "logged out" mid-operation.
 */
const USER_DATA_TRANSIENT_RETRIES = 6;

/**
 * Fetch + cache the current user envelope from `/auth/user-data` and keep
 * the global `permissionManager` in sync.
 *
 * `refetchOnMount: false` is intentional: when an auth cookie is present,
 * `ServerProviders` SSR-seeds the cache with the real envelope so the
 * first client paint already knows the auth state. For anonymous visitors
 * we no longer seed a negative sentinel (it caused `HydrationBoundary` to
 * overwrite the post-login cache entry on client navigations and flash
 * "Login"), so this hook will perform one client fetch on first mount to
 * confirm the anonymous state. Stale-window + focus refetches keep the
 * cache honest after that.
 */
export function useUserData() {
    const query = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA,
        queryFn: async (): Promise<IUserDataResponse> => AuthApi.getUserData(),
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.USER_DATA.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.USER_DATA.gcTime,
        refetchOnWindowFocus: REACT_QUERY_CONFIG.CACHE_TIERS.USER_DATA.refetchOnWindowFocus,
        refetchOnMount: false,
        retry: (failureCount, error: any) => {
            // A genuine `401` (session expired) must surface immediately so the
            // shell can react — never retry it.
            if (error?.response?.status === 401) return false;
            // A backend restart (plugin/system operation) makes user-data
            // answer 5xx / network for a few seconds. Ride it out so the
            // operator's auth state does not flicker to "logged out"
            // mid-operation; React Query keeps the last-known envelope while
            // retrying, so `isAuthenticated` stays stable.
            if (isTransientApiError(error)) return failureCount < USER_DATA_TRANSIENT_RETRIES;
            return failureCount < 1;
        },
        retryDelay: transientRetryDelay,
        meta: { errorMessage: 'Failed to fetch user data' },
    });

    const permissions = query.data?.data?.permissions;
    const settled = !query.isLoading;
    const errored = query.isError;
    useEffect(() => {
        if (permissions) {
            permissionManager.setPermissions(permissions);
        } else if (errored || settled) {
            permissionManager.clearPermissions();
        }
    }, [permissions, errored, settled]);

    return query;
}

/**
 * Returns the transformed user payload, a memo-stable permission checker,
 * and the query's loading state. Use this for any component that needs the
 * full profile (header avatar, admin gating, etc).
 */
export function useAuthUser(): {
    user: IAuthUser | null;
    permissionChecker: PermissionChecker | null;
    isLoading: boolean;
    error: unknown;
} {
    const { data: userDataResponse, isLoading, error } = useUserData();
    const user = userDataResponse?.data ? transformUserData(userDataResponse.data) : null;
    const permissionChecker = userDataResponse?.data
        ? createPermissionChecker(userDataResponse.data.permissions)
        : null;
    return { user, permissionChecker, isLoading, error };
}

function transformUserData(userData: IUserData): IAuthUser {
    // `userData.timezone` is `null` when the user has no timezone AND the
    // CMS default is unconfigured (or its lookup is missing). `language`
    // is always an object on the backend, but we still defend against a
    // schema regression rather than crash the whole shell.
    const language = userData.language ?? { id: null, locale: null, name: null };
    const timezone = userData.timezone;
    return {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email,
        user_name: userData.user_name,
        blocked: userData.blocked,
        receivesNotifications: userData.receives_notifications,
        receivesEmails: userData.receives_emails,
        aclVersion: userData.acl_version ?? null,
        roles: userData.roles,
        permissions: userData.permissions,
        groups: userData.groups,
        languageId: language.id,
        languageLocale: language.locale,
        languageName: language.name,
        timezoneId: timezone ? timezone.id : null,
        timezoneLookupCode: timezone ? timezone.code : null,
        timezoneLookupValue: timezone ? timezone.name : null,
    };
}

/**
 * Lightweight `{ isAuthenticated, isLoading, isBackendUnavailable, user }`
 * view over `useAuthUser` for UI components that only need to gate render on
 * auth state (header profile button, admin shell). Replaces Refine's
 * `useIsAuthenticated`, whose own internal query starts every mount with
 * `isLoading: true` and defeated our SSR-hydrated cache.
 *
 * `isBackendUnavailable` is `true` when there is no resolved user AND the
 * failure was a TRANSIENT backend outage (5xx / network — the manager
 * restarting Symfony for a plugin/system operation) rather than a genuine
 * `401`. Auth gates use it to stay put instead of bouncing to login while the
 * backend briefly restarts. It is `false` once a real user resolves (the
 * common case) and for a genuine session expiry.
 */
export function useAuthStatus(): {
    isAuthenticated: boolean;
    isLoading: boolean;
    isBackendUnavailable: boolean;
    user: IAuthUser | null;
} {
    const { user, isLoading, error } = useAuthUser();
    const isBackendUnavailable = user === null && isTransientApiError(error);
    return { isAuthenticated: user !== null, isLoading, isBackendUnavailable, user };
}
