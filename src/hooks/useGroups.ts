/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminGroupApi } from '../api/admin/group.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { notifications } from '@mantine/notifications';
import type { 
  IGroupsListParams
} from '../types/responses/admin/groups.types';
import type {
  ICreateGroupRequest,
  IUpdateGroupRequest,
  IUpdateGroupAclsRequest,
  IUpdateGroupAssetAclsRequest
} from '../types/requests/admin/groups.types';

// Query keys
const GROUPS_QUERY_KEYS = {
  all: ['groups'] as const,
  lists: () => [...GROUPS_QUERY_KEYS.all, 'list'] as const,
  list: (params: IGroupsListParams) => [...GROUPS_QUERY_KEYS.lists(), params] as const,
  details: () => [...GROUPS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...GROUPS_QUERY_KEYS.details(), id] as const,
  acls: (id: number) => [...GROUPS_QUERY_KEYS.all, 'acls', id] as const,
  assetAcls: (id: number) => [...GROUPS_QUERY_KEYS.all, 'asset-acls', id] as const,
  members: (id: number) => [...GROUPS_QUERY_KEYS.all, 'members', id] as const,
};

// Get paginated groups
export function useGroups(params: IGroupsListParams = {}) {
  return useQuery({
    queryKey: GROUPS_QUERY_KEYS.list(params),
    queryFn: () => AdminGroupApi.getGroups(params),
    staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.STATIC.staleTime,
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

// List a group's members. Enabled only when a group is selected so the
// "View members" modal fetches lazily on open, not on every list render.
export function useGroupMembers(groupId: number | null) {
  return useQuery({
    queryKey: GROUPS_QUERY_KEYS.members(groupId ?? 0),
    queryFn: () => AdminGroupApi.getGroupMembers(groupId as number),
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
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create group',
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
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update group',
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
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete group',
        color: 'red',
      });
    },
  });
}

// Get a group's asset-folder ACLs. Enabled only when a group is selected so
// the group ACL modal fetches lazily on open.
export function useGroupAssetAcls(groupId: number | null) {
  return useQuery({
    queryKey: GROUPS_QUERY_KEYS.assetAcls(groupId ?? 0),
    queryFn: () => AdminGroupApi.getGroupAssetAcls(groupId as number),
    enabled: !!groupId,
    staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
  });
}

// Update a group's asset-folder ACLs (full replacement).
export function useUpdateGroupAssetAcls() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: number; data: IUpdateGroupAssetAclsRequest }) =>
      AdminGroupApi.updateGroupAssetAcls(groupId, data),
    onSuccess: (_, { groupId }) => {
      void queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEYS.assetAcls(groupId) });
      notifications.show({
        title: 'Success',
        message: 'Group asset access updated successfully',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      notifications.show({
        title: 'Error',
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update group asset access',
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
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update group ACLs',
        color: 'red',
      });
    },
  });
} 