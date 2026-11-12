/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminGroupApi } from '../api/admin/group.api';
import { REACT_QUERY_CONFIG, refetchOnMountWhenInvalidated } from '../config/react-query.config';
import { notifications } from '@mantine/notifications';
import type { 
  IGroupsListParams,
  IGroupsListResponse
} from '../types/responses/admin/groups.types';
import type {
  ICreateGroupRequest,
  IUpdateGroupRequest,
  IUpdateGroupAclsRequest
} from '../types/requests/admin/groups.types';
import { getApiErrorText } from '../utils/mutation-error-handler';

// Query keys. The root is the registry's `GROUPS_ALL`: other hooks (the users
// mutations that change memberships) invalidate it too.
const GROUPS_QUERY_KEYS = {
  all: REACT_QUERY_CONFIG.QUERY_KEYS.GROUPS_ALL,
  everyGroup: () => [...GROUPS_QUERY_KEYS.all, 'every'] as const,
  lists: () => [...GROUPS_QUERY_KEYS.all, 'list'] as const,
  list: (params: IGroupsListParams) => [...GROUPS_QUERY_KEYS.lists(), params] as const,
  details: () => [...GROUPS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...GROUPS_QUERY_KEYS.details(), id] as const,
  acls: (id: number) => [...GROUPS_QUERY_KEYS.all, 'acls', id] as const,
};

// Get paginated groups. The member counts change when the Users page edits
// memberships, so an invalidation made while this list was unmounted still
// refetches it at the next mount.
export function useGroups(params: IGroupsListParams = {}) {
  return useQuery({
    queryKey: GROUPS_QUERY_KEYS.list(params),
    queryFn: () => AdminGroupApi.getGroups(params),
    staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.STATIC.staleTime,
    refetchOnMount: refetchOnMountWhenInvalidated,
  });
}

/**
 * EVERY group by name, for pickers: a picker that offers only the first page
 * hides the other groups from the admin with no hint. The list endpoint serves at
 * most 100 rows per request, so this reads all pages; a screen that shows one
 * page at a time uses `useGroups`. Shares the `groups` key root, so every group
 * mutation that invalidates `GROUPS_QUERY_KEYS.all` refreshes it too.
 *
 * A dialog that is always mounted but mostly closed passes `enabled: opened`, so
 * the list is read when someone needs it rather than on every page visit.
 */
export function useAllGroups({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: GROUPS_QUERY_KEYS.everyGroup(),
    queryFn: async (): Promise<Pick<IGroupsListResponse, 'groups'>> => ({
      groups: await AdminGroupApi.getAllGroups(),
    }),
    staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.STATIC.staleTime,
    refetchOnMount: refetchOnMountWhenInvalidated,
    enabled,
  });
}

// Get group details
export function useGroupDetails(groupId: number) {
  return useQuery({
    queryKey: GROUPS_QUERY_KEYS.detail(groupId),
    queryFn: () => AdminGroupApi.getGroupById(groupId),
    enabled: !!groupId,
    staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
  });
}

// Get group ACLs
export function useGroupAcls(groupId: number) {
  return useQuery({
    queryKey: GROUPS_QUERY_KEYS.acls(groupId),
    queryFn: () => AdminGroupApi.getGroupAcls(groupId),
    enabled: !!groupId,
    staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
  });
}

// Create group mutation
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateGroupRequest) => AdminGroupApi.createGroup(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEYS.all });
      notifications.show({
        title: 'Success',
        message: 'Group created successfully',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      notifications.show({
        title: 'Error',
        message: getApiErrorText(error) || 'Failed to create group',
        color: 'red',
      });
    },
  });
}

// Update group mutation
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: number; data: IUpdateGroupRequest }) =>
      AdminGroupApi.updateGroup(groupId, data),
    onSuccess: (_, { groupId }) => {
      void queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEYS.detail(groupId) });
      notifications.show({
        title: 'Success',
        message: 'Group updated successfully',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      notifications.show({
        title: 'Error',
        message: getApiErrorText(error) || 'Failed to update group',
        color: 'red',
      });
    },
  });
}

// Delete group mutation
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: number) => AdminGroupApi.deleteGroup(groupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEYS.all });
      notifications.show({
        title: 'Success',
        message: 'Group deleted successfully',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      notifications.show({
        title: 'Error',
        message: getApiErrorText(error) || 'Failed to delete group',
        color: 'red',
      });
    },
  });
}


// Update group ACLs mutation
export function useUpdateGroupAcls() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: number; data: IUpdateGroupAclsRequest }) =>
      AdminGroupApi.updateGroupAcls(groupId, data),
    onSuccess: (_, { groupId }) => {
      // Invalidate all group-related queries to ensure fresh data
      void queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEYS.acls(groupId) });
      void queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEYS.detail(groupId) });
      notifications.show({
        title: 'Success',
        message: 'Group ACLs updated successfully',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      notifications.show({
        title: 'Error',
        message: getApiErrorText(error) || 'Failed to update group ACLs',
        color: 'red',
      });
    },
  });
} 