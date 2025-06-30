import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminGroupApi } from '../api/admin/group.api';
import { notifications } from '@mantine/notifications';
import type { 
  IGroupsListParams, 
  IGroupsListResponse, 
  IGroupDetails,
  IGroupAcl
} from '../types/responses/admin/groups.types';
import type {
  ICreateGroupRequest,
  IUpdateGroupRequest,
  IUpdateGroupAclsRequest
} from '../types/requests/admin/groups.types';

// Query keys
const GROUPS_QUERY_KEYS = {
  all: ['groups'] as const,
  lists: () => [...GROUPS_QUERY_KEYS.all, 'list'] as const,
  list: (params: IGroupsListParams) => [...GROUPS_QUERY_KEYS.lists(), params] as const,
  details: () => [...GROUPS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...GROUPS_QUERY_KEYS.details(), id] as const,
  allGroups: () => [...GROUPS_QUERY_KEYS.all, 'all-groups'] as const,
  acls: (id: number) => [...GROUPS_QUERY_KEYS.all, 'acls', id] as const,
};

// Get paginated groups
export function useGroups(params: IGroupsListParams = {}) {
  return useQuery({
    queryKey: GROUPS_QUERY_KEYS.list(params),
    queryFn: () => AdminGroupApi.getGroups(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get all groups (for dropdowns)
export function useAllGroups() {
  return useQuery({
    queryKey: GROUPS_QUERY_KEYS.allGroups(),
    queryFn: () => AdminGroupApi.getAllGroups(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get group details
export function useGroupDetails(groupId: number) {
  return useQuery({
    queryKey: GROUPS_QUERY_KEYS.detail(groupId),
    queryFn: () => AdminGroupApi.getGroupById(groupId),
    enabled: !!groupId,
  });
}

// Get group ACLs
export function useGroupAcls(groupId: number) {
  return useQuery({
    queryKey: GROUPS_QUERY_KEYS.acls(groupId),
    queryFn: () => AdminGroupApi.getGroupAcls(groupId),
    enabled: !!groupId,
  });
}

// Create group mutation
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateGroupRequest) => AdminGroupApi.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEYS.all });
      notifications.show({
        title: 'Success',
        message: 'Group created successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create group',
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
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEYS.detail(groupId) });
      notifications.show({
        title: 'Success',
        message: 'Group updated successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update group',
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
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEYS.all });
      notifications.show({
        title: 'Success',
        message: 'Group deleted successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete group',
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
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEYS.acls(groupId) });
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEYS.detail(groupId) });
      notifications.show({
        title: 'Success',
        message: 'Group ACLs updated successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update group ACLs',
        color: 'red',
      });
    },
  });
} 