import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminRoleApi } from '../api/admin/role.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { notifications } from '@mantine/notifications';
import type { 
  IRolesListParams, 
  IRolesListResponse, 
  IRoleDetails,
  IRolePermission
} from '../types/responses/admin/roles.types';
import type {
  ICreateRoleRequest,
  IUpdateRoleRequest,
  IUpdateRolePermissionsRequest,
  IAddPermissionsToRoleRequest,
  IRemovePermissionsFromRoleRequest
} from '../types/requests/admin/roles.types';

// Query keys
const ROLES_QUERY_KEYS = {
  all: ['roles'] as const,
  lists: () => [...ROLES_QUERY_KEYS.all, 'list'] as const,
  list: (params: IRolesListParams) => [...ROLES_QUERY_KEYS.lists(), params] as const,
  details: () => [...ROLES_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...ROLES_QUERY_KEYS.details(), id] as const,
  permissions: (id: number) => [...ROLES_QUERY_KEYS.all, 'permissions', id] as const,
};

// Get paginated roles
export function useRoles(params: IRolesListParams = {}) {
  return useQuery({
    queryKey: ROLES_QUERY_KEYS.list(params),
    queryFn: () => AdminRoleApi.getRoles(params),
    staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.staleTime,
  });
}

// Get role details
export function useRoleDetails(roleId: number) {
  return useQuery({
    queryKey: ROLES_QUERY_KEYS.detail(roleId),
    queryFn: () => AdminRoleApi.getRoleById(roleId),
    enabled: !!roleId,
    staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
  });
}

// Get role permissions
export function useRolePermissions(roleId: number) {
  return useQuery({
    queryKey: ROLES_QUERY_KEYS.permissions(roleId),
    queryFn: () => AdminRoleApi.getRolePermissions(roleId),
    enabled: !!roleId,
    staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
  });
}

// Create role mutation
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateRoleRequest) => AdminRoleApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.all });
      notifications.show({
        title: 'Success',
        message: 'Role created successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create role',
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
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.detail(roleId) });
      notifications.show({
        title: 'Success',
        message: 'Role updated successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update role',
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
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.all });
      notifications.show({
        title: 'Success',
        message: 'Role deleted successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete role',
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
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.permissions(roleId) });
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.detail(roleId) });
      notifications.show({
        title: 'Success',
        message: 'Role permissions updated successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update role permissions',
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
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.permissions(roleId) });
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.detail(roleId) });
      notifications.show({
        title: 'Success',
        message: 'Permissions added to role successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to add permissions to role',
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
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.permissions(roleId) });
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEYS.detail(roleId) });
      notifications.show({
        title: 'Success',
        message: 'Permissions removed from role successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to remove permissions from role',
        color: 'red',
      });
    },
  });
} 