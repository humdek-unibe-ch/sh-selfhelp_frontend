'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthApi } from '../api/auth.api';
import { IUserDataResponse, IAuthUser, IUserData } from '../types/auth/jwt-payload.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { getAccessToken } from '../utils/auth.utils';

/**
 * Hook to fetch current user data from /auth/user-data endpoint
 * This replaces JWT-based user information with comprehensive user data
 * 
 * @returns User data query result with user information, permissions, roles, and language
 */
export function useUserData() {
    const queryClient = useQueryClient();
    
    return useQuery({
        queryKey: ['auth', 'user-data'],
        queryFn: async (): Promise<IUserDataResponse> => {
            return AuthApi.getUserData();
        },
        enabled: !!getAccessToken(), // Only fetch when user is authenticated
        staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.USER_DATA.staleTime,
        gcTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.USER_DATA.gcTime,
        retry: (failureCount, error: any) => {
            // Don't retry on 401 (unauthorized) errors
            if (error?.response?.status === 401) {
                return false;
            }
            return failureCount < 3;
        },
        meta: {
            errorMessage: 'Failed to fetch user data'
        }
    });
}

/**
 * Hook to get transformed user data in IAuthUser format
 * Converts the API response to the expected user interface
 * 
 * @returns Transformed user data or null if not available
 */
export function useAuthUser(): { user: IAuthUser | null; isLoading: boolean; error: any } {
    const { data: userDataResponse, isLoading, error } = useUserData();
    
    const user: IAuthUser | null = userDataResponse?.data ? transformUserData(userDataResponse.data) : null;
    
    return {
        user,
        isLoading,
        error
    };
}

/**
 * Hook to invalidate user data cache
 * Useful after language changes or other operations that affect user data
 */
export function useInvalidateUserData() {
    const queryClient = useQueryClient();
    
    return () => {
        queryClient.invalidateQueries({ queryKey: ['auth', 'user-data'] });
    };
}

/**
 * Transform user data from API response to IAuthUser interface
 */
function transformUserData(userData: IUserData): IAuthUser {
    return {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email, // Fallback to email if name is null
        user_name: userData.user_name,
        blocked: userData.blocked,
        roles: userData.roles,
        permissions: userData.permissions,
        groups: userData.groups,
        languageId: userData.language.id,
        languageLocale: userData.language.locale,
        languageName: userData.language.name
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
