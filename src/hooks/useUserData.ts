'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AuthApi } from '../api/auth.api';
import { IUserDataResponse, IAuthUser, IUserData } from '../types/auth/jwt-payload.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { createPermissionChecker, PermissionChecker } from '../utils/permissions.utils';
import { permissionManager } from '../api/permission-wrapper.api';

/**
 * Fetch + cache the current user envelope from `/auth/user-data` and keep
 * the global `permissionManager` in sync.
 *
 * `refetchOnMount: false` is intentional: `ServerProviders` SSR-seeds the
 * cache with either the real envelope or an anonymous sentinel, so the
 * first client paint already knows the auth state. Stale-window + focus
 * refetches still keep the cache honest after that.
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
            if (error?.response?.status === 401) return false;
            return failureCount < 1;
        },
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
    return {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email,
        user_name: userData.user_name,
        blocked: userData.blocked,
        aclVersion: userData.acl_version ?? null,
        roles: userData.roles,
        permissions: userData.permissions,
        groups: userData.groups,
        languageId: userData.language.id,
        languageLocale: userData.language.locale,
        languageName: userData.language.name,
        timezoneId: userData.timezone.id,
        timezoneLookupCode: userData.timezone.lookupCode,
        timezoneLookupValue: userData.timezone.lookupValue,
    };
}

/**
 * Lightweight `{ isAuthenticated, isLoading, user }` view over `useAuthUser`
 * for UI components that only need to gate render on auth state (header
 * profile button, admin shell). Replaces Refine's `useIsAuthenticated`,
 * whose own internal query starts every mount with `isLoading: true` and
 * defeated our SSR-hydrated cache.
 */
export function useAuthStatus(): {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: IAuthUser | null;
} {
    const { user, isLoading } = useAuthUser();
    return { isAuthenticated: user !== null, isLoading, user };
}
