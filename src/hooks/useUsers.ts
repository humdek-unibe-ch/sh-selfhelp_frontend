import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminUserApi } from '../api/admin/user.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import type { 
  IUsersListParams, 
  IUsersListResponse, 
  IUserDetails, 
  IUserGroup, 
  IUserRole 
} from '../types/responses/admin/users.types';
import type {
  ICreateUserRequest,
  IUpdateUserRequest,
  IToggleUserBlockRequest,
  IUserGroupsRequest,
  IUserRolesRequest
} from '../types/requests/admin/users.types';
import { parseApiError } from '../utils/mutation-error-handler';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import React from 'react';

// Query Keys
export const USER_QUERY_KEYS = {
  all: ['users'] as const,
  lists: () => [...USER_QUERY_KEYS.all, 'list'] as const,
  list: (params: IUsersListParams) => [...USER_QUERY_KEYS.lists(), params] as const,
  details: () => [...USER_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...USER_QUERY_KEYS.details(), id] as const,
  groups: (id: number) => [...USER_QUERY_KEYS.all, 'groups', id] as const,
  roles: (id: number) => [...USER_QUERY_KEYS.all, 'roles', id] as const,
};

// Common error handler
const handleMutationError = (error: any) => {
  const { errorMessage, errorTitle } = parseApiError(error);
  notifications.show({
    title: errorTitle,
    message: errorMessage,
    icon: React.createElement(IconX, { size: '1rem' }),
    color: 'red',
    autoClose: 8000,
    position: 'top-center',
  });
};

/**
 * Hook to fetch paginated users list with search and sorting
 */
export function useUsers(params: IUsersListParams = {}) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.list(params),
    queryFn: () => AdminUserApi.getUsers(params),
    staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.USER_DATA.staleTime,
  });
}

/**
 * Hook to fetch single user details
 */
export function useUser(userId: number) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.detail(userId),
    queryFn: () => AdminUserApi.getUserById(userId),
    enabled: !!userId,
  });
}

/**
 * Alias for useUser for consistency
 */
export const useUserDetails = useUser;

/**
 * Hook to fetch user groups
 */
export function useUserGroups(userId: number) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.groups(userId),
    queryFn: () => AdminUserApi.getUserGroups(userId),
    enabled: !!userId,
  });
}

/**
 * Hook to fetch user roles
 */
export function useUserRoles(userId: number) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.roles(userId),
    queryFn: () => AdminUserApi.getUserRoles(userId),
    enabled: !!userId,
  });
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: ICreateUserRequest) => AdminUserApi.createUser(userData),
    onSuccess: (data) => {
      // Invalidate users list to refresh data
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      
      notifications.show({
        title: 'User Created',
        message: `User ${data.email} was created successfully!`,
        icon: React.createElement(IconCheck, { size: '1rem' }),
        color: 'green',
        autoClose: 5000,
        position: 'top-center',
      });
    },
    onError: handleMutationError,
  });
}

/**
 * Hook to update user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, userData }: { userId: number; userData: IUpdateUserRequest }) =>
      AdminUserApi.updateUser(userId, userData),
    onSuccess: (data, { userId }) => {
      // Update specific user cache
      queryClient.setQueryData(USER_QUERY_KEYS.detail(userId), data);
      // Invalidate users list to refresh data
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      
      notifications.show({
        title: 'User Updated',
        message: `User ${data.email} was updated successfully!`,
        icon: React.createElement(IconCheck, { size: '1rem' }),
        color: 'green',
        autoClose: 5000,
        position: 'top-center',
      });
    },
    onError: handleMutationError,
  });
}

/**
 * Hook to delete user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => AdminUserApi.deleteUser(userId),
    onSuccess: (_, userId) => {
      // Remove user from cache
      queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.detail(userId) });
      // Invalidate users list to refresh data
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      
      notifications.show({
        title: 'User Deleted',
        message: 'User was deleted successfully!',
        icon: React.createElement(IconCheck, { size: '1rem' }),
        color: 'green',
        autoClose: 5000,
        position: 'top-center',
      });
    },
    onError: handleMutationError,
  });
}

/**
 * Hook to toggle user block status
 */
export function useToggleUserBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: IToggleUserBlockRequest }) =>
      AdminUserApi.toggleUserBlock(userId, data),
    onSuccess: (data, { userId, data: blockData }) => {
      // Update specific user cache
      queryClient.setQueryData(USER_QUERY_KEYS.detail(userId), data);
      // Invalidate users list to refresh data
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      
      notifications.show({
        title: blockData.blocked ? 'User Blocked' : 'User Unblocked',
        message: `User ${data.email} was ${blockData.blocked ? 'blocked' : 'unblocked'} successfully!`,
        icon: React.createElement(IconCheck, { size: '1rem' }),
        color: 'green',
        autoClose: 5000,
        position: 'top-center',
      });
    },
    onError: handleMutationError,
  });
}

/**
 * Hook to add groups to user
 */
export function useAddGroupsToUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: IUserGroupsRequest }) =>
      AdminUserApi.addGroupsToUser(userId, data),
    onSuccess: (data, { userId }) => {
      // Update user groups cache
      queryClient.setQueryData(USER_QUERY_KEYS.groups(userId), data);
      // Invalidate user details and list
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(userId) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      
      notifications.show({
        title: 'Groups Added',
        message: 'Groups were added to user successfully!',
        icon: React.createElement(IconCheck, { size: '1rem' }),
        color: 'green',
        autoClose: 5000,
        position: 'top-center',
      });
    },
    onError: handleMutationError,
  });
}

/**
 * Hook to remove groups from user
 */
export function useRemoveGroupsFromUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: IUserGroupsRequest }) =>
      AdminUserApi.removeGroupsFromUser(userId, data),
    onSuccess: (_, { userId }) => {
      // Invalidate user groups, details and list
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.groups(userId) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(userId) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      
      notifications.show({
        title: 'Groups Removed',
        message: 'Groups were removed from user successfully!',
        icon: React.createElement(IconCheck, { size: '1rem' }),
        color: 'green',
        autoClose: 5000,
        position: 'top-center',
      });
    },
    onError: handleMutationError,
  });
}

/**
 * Hook to add roles to user
 */
export function useAddRolesToUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: IUserRolesRequest }) =>
      AdminUserApi.addRolesToUser(userId, data),
    onSuccess: (data, { userId }) => {
      // Update user roles cache
      queryClient.setQueryData(USER_QUERY_KEYS.roles(userId), data);
      // Invalidate user details and list
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(userId) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      
      notifications.show({
        title: 'Roles Added',
        message: 'Roles were added to user successfully!',
        icon: React.createElement(IconCheck, { size: '1rem' }),
        color: 'green',
        autoClose: 5000,
        position: 'top-center',
      });
    },
    onError: handleMutationError,
  });
}

/**
 * Hook to remove roles from user
 */
export function useRemoveRolesFromUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: IUserRolesRequest }) =>
      AdminUserApi.removeRolesFromUser(userId, data),
    onSuccess: (_, { userId }) => {
      // Invalidate user roles, details and list
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.roles(userId) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(userId) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      
      notifications.show({
        title: 'Roles Removed',
        message: 'Roles were removed from user successfully!',
        icon: React.createElement(IconCheck, { size: '1rem' }),
        color: 'green',
        autoClose: 5000,
        position: 'top-center',
      });
    },
    onError: handleMutationError,
  });
}

/**
 * Hook to send activation mail
 */
export function useSendActivationMail() {
  return useMutation({
    mutationFn: (userId: number) => AdminUserApi.sendActivationMail(userId),
    onSuccess: () => {
      notifications.show({
        title: 'Activation Mail Sent',
        message: 'Activation mail was sent successfully!',
        icon: React.createElement(IconCheck, { size: '1rem' }),
        color: 'green',
        autoClose: 5000,
        position: 'top-center',
      });
    },
    onError: handleMutationError,
  });
}

/**
 * Hook to clean user data
 */
export function useCleanUserData() {
  return useMutation({
    mutationFn: (userId: number) => AdminUserApi.cleanUserData(userId),
    onSuccess: () => {
      notifications.show({
        title: 'User Data Cleaned',
        message: 'User data was cleaned successfully!',
        icon: React.createElement(IconCheck, { size: '1rem' }),
        color: 'green',
        autoClose: 5000,
        position: 'top-center',
      });
    },
    onError: handleMutationError,
  });
}

/**
 * Hook to impersonate user
 */
export function useImpersonateUser() {
  return useMutation({
    mutationFn: (userId: number) => AdminUserApi.impersonateUser(userId),
    onSuccess: () => {
      notifications.show({
        title: 'User Impersonation Started',
        message: 'You are now impersonating the user!',
        icon: React.createElement(IconCheck, { size: '1rem' }),
        color: 'green',
        autoClose: 5000,
        position: 'top-center',
      });
    },
    onError: handleMutationError,
  });
} 