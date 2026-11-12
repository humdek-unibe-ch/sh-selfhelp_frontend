/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminRoleApi } from '../api/admin/role.api';
import { REACT_QUERY_CONFIG, refetchOnMountWhenInvalidated } from '../config/react-query.config';
import { notifications } from '@mantine/notifications';
import type { 
  IRolesListParams, 
  IRolesListResponse,
} from '../types/responses/admin/roles.types';
import type {
  ICreateRoleRequest,
  IUpdateRoleRequest,
  IUpdateRolePermissionsRequest,
  IAddPermissionsToRoleRequest,
  IRemovePermissionsFromRoleRequest
} from '../types/requests/admin/roles.types';
import { getApiErrorText } from '../utils/mutation-error-handler';

// Query keys. The root is the registry's `ROLES_ALL`: other hooks (the users
// mutations that change role membership) invalidate it too.
const ROLES_QUERY_KEYS = {
  all: REACT_QUERY_CONFIG.QUERY_KEYS.ROLES_ALL,
  everyRole: () => [...ROLES_QUERY_KEYS.all, 'every'] as const,
  lists: () => [...ROLES_QUERY_KEYS.all, 'list'] as const,
  list: (params: IRolesListParams) => [...ROLES_QUERY_KEYS.lists(), params] as const,
  details: () => [...ROLES_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...ROLES_QUERY_KEYS.details(), id] as const,
  permissions: (id: number) => [...ROLES_QUERY_KEYS.all, 'permissions', id] as const,
};

// Get paginated roles. The member counts change when users are deleted from the
// Users page, so an invalidation made while this list was unmounted still
// refetches it at the next mount.
export function useRoles(params: IRolesListParams = {}) {
  return useQuery({
    queryKey: ROLES_QUERY_KEYS.list(params),
    queryFn: () => AdminRoleApi.getRoles(params),
    staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.STATIC.staleTime,
    refetchOnMount: refetchOnMountWhenInvalidated,
  });
}

/**
 * EVERY role by name, for pickers (see `useAllGroups`): the list endpoint serves
 * at most 100 rows per request, so this reads all pages. Shares the `roles` key
 * root, so every role mutation that invalidates `ROLES_QUERY_KEYS.all` refreshes
 * it too.
 *
 * A dialog that is always mounted but mostly closed passes `enabled: opened`, so
 * the list is read when someone needs it rather than on every page visit.
 */
export function useAllRoles({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ROLES_QUERY_KEYS.everyRole(),
    queryFn: async (): Promise<Pick<IRolesListResponse, 'roles'>> => ({
      roles: await AdminRoleApi.getAllRoles(),
    }),
    staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.STATIC.staleTime,
    refetchOnMount: refetchOnMountWhenInvalidated,
    enabled,
  });
}

// Get role details
export function useRoleDetails(roleId: number) {
  return useQuery({
    queryKey: ROLES_QUERY_KEYS.detail(roleId),
    queryFn: () => AdminRoleApi.getRoleById(roleId),
    enabled: !!roleId,
    staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
  });
}

// Get role permissions
export function useRolePermissions(roleId: number) {
  return useQuery({
    queryKey: ROLES_QUERY_KEYS.permissions(roleId),
    queryFn: () => AdminRoleApi.getRolePermissions(roleId),
    enabled: !!roleId,
    staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
  });
}

// Create role mutation
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateRoleRequest) => AdminRoleApi.createRole(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.all });
      notifications.show({
        title: 'Success',
        message: 'Role created successfully',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      notifications.show({
        title: 'Error',
        message: getApiErrorText(error) || 'Failed to create role',
        color: 'red',
      });
    },
  });
}

// Update role mutation
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: number; data: IUpdateRoleRequest }) =>
      AdminRoleApi.updateRole(roleId, data),
    onSuccess: () => {
      // The ['roles'] prefix also covers this role's detail key.
      void queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.all });
      notifications.show({
        title: 'Success',
        message: 'Role updated successfully',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      notifications.show({
        title: 'Error',
        message: getApiErrorText(error) || 'Failed to update role',
        color: 'red',
      });
    },
  });
}

// Delete role mutation
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: number) => AdminRoleApi.deleteRole(roleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.all });
      notifications.show({
        title: 'Success',
        message: 'Role deleted successfully',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      notifications.show({
        title: 'Error',
        message: getApiErrorText(error) || 'Failed to delete role',
        color: 'red',
      });
    },
  });
}

// Update role permissions mutation
export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: number; data: IUpdateRolePermissionsRequest }) =>
      AdminRoleApi.updateRolePermissions(roleId, data),
    onSuccess: (_, { roleId }) => {
      void queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.permissions(roleId) });
      void queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.detail(roleId) });
      notifications.show({
        title: 'Success',
        message: 'Role permissions updated successfully',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      notifications.show({
        title: 'Error',
        message: getApiErrorText(error) || 'Failed to update role permissions',
        color: 'red',
      });
    },
  });
}

// Add permissions to role mutation
export function useAddPermissionsToRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: number; data: IAddPermissionsToRoleRequest }) =>
      AdminRoleApi.addPermissionsToRole(roleId, data),
    onSuccess: (_, { roleId }) => {
      void queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.permissions(roleId) });
      void queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.detail(roleId) });
      notifications.show({
        title: 'Success',
        message: 'Permissions added to role successfully',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      notifications.show({
        title: 'Error',
        message: getApiErrorText(error) || 'Failed to add permissions to role',
        color: 'red',
      });
    },
  });
}

// Remove permissions from role mutation
export function useRemovePermissionsFromRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: number; data: IRemovePermissionsFromRoleRequest }) =>
      AdminRoleApi.removePermissionsFromRole(roleId, data),
    onSuccess: (_, { roleId }) => {
      void queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.permissions(roleId) });
      void queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.detail(roleId) });
      notifications.show({
        title: 'Success',
        message: 'Permissions removed from role successfully',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      notifications.show({
        title: 'Error',
        message: getApiErrorText(error) || 'Failed to remove permissions from role',
        color: 'red',
      });
    },
  });
} 