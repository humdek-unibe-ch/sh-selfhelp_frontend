'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AuthApi } from '../api/auth.api';
import { IUserDataResponse, IAuthUser, IUserData } from '../types/auth/jwt-payload.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { createPermissionChecker, PermissionChecker } from '../utils/permissions.utils';
import { permissionManager } from '../api/permission-wrapper.api';

/**
 * Hook to fetch current user data from /auth/user-data endpoint
 * This replaces JWT-based user information with comprehensive user data
 * Also syncs permissions with the global permission manager for API access control
 * 
 * @returns User data query result with user information, permissions, roles, and language
 */
export function useUserData() {
    const query = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA,
        queryFn: async (): Promise<IUserDataResponse> => {
            return AuthApi.getUserData();
        },
        // Always enabled: the BFF translates missing auth into a 401 and we
        // let React Query cache that negative state. No client-visible token
        // to gate on now that auth lives in httpOnly cookies.
        enabled: true,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.USER_DATA.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.USER_DATA.gcTime,
        refetchOnWindowFocus: REACT_QUERY_CONFIG.CACHE_TIERS.USER_DATA.refetchOnWindowFocus,
        retry: (failureCount, error: any) => {
            if (error?.response?.status === 401) {
                return false;
            }
            return failureCount < 1;
        },
        meta: {
            errorMessage: 'Failed to fetch user data'
        }
    });

    // Sync permissions with global permission manager whenever user data changes
    useEffect(() => {
        if (query.data?.data?.permissions) {
            permissionManager.setPermissions(query.data.data.permissions);
        } else if (query.isError || (!query.isLoading && !query.data)) {
            permissionManager.clearPermissions();
        }
    }, [query.data?.data?.permissions, query.isError, query.isLoading, query.data]);

    return query;
}

/**
 * Hook to get transformed user data in IAuthUser format
 * Converts the API response to the expected user interface
 *
 * @returns Transformed user data, permission checker, and loading state
 */
export function useAuthUser(): {
    user: IAuthUser | null;
    permissionChecker: PermissionChecker | null;
    isLoading: boolean;
    error: any
} {
    const { data: userDataResponse, isLoading, error } = useUserData();

    const user: IAuthUser | null = userDataResponse?.data ? transformUserData(userDataResponse.data) : null;
    const permissionChecker: PermissionChecker | null = userDataResponse?.data
        ? createPermissionChecker(userDataResponse.data.permissions)
        : null;

    return {
        user,
        permissionChecker,
        isLoading,
        error
    };
}

/**
 * Transform user data from API response to IAuthUser interface
 */
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
        timezoneLookupValue: userData.timezone.lookupValue
    };
}

/**
 * Hook to check if user has specific permission using new user data structure
 */
export function useHasPermission() {
    const { user } = useAuthUser();
    
    return (permission: string): boolean => {
        if (!user || !user.permissions) return false;
        return user.permissions.includes(permission);
    };
}

/**
 * Hook to check if user has admin access using new user data structure
 */
export function useHasAdminAccess() {
    const hasPermission = useHasPermission();
    
    return (): boolean => {
        return hasPermission('admin.access');
    };
}
