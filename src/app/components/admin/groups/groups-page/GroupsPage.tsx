"use client";

import { useState } from 'react';
import { GroupsList } from '../groups-list/GroupsList';
import { useDeleteGroup } from '../../../../../hooks/useGroups';
import { notifications } from '@mantine/notifications';

export function GroupsPage() {
  const deleteGroupMutation = useDeleteGroup();

  // Handle create group
  const handleCreateGroup = () => {
    // TODO: Implement create group modal
    notifications.show({
      title: 'Coming Soon',
      message: 'Create group functionality will be implemented soon',
      color: 'blue',
    });
  };

  // Handle edit group
  const handleEditGroup = (groupId: number) => {
    // TODO: Implement edit group modal
    notifications.show({
      title: 'Coming Soon',
      message: `Edit group functionality will be implemented soon (Group ID: ${groupId})`,
      color: 'blue',
    });
  };

  // Handle delete group
  const handleDeleteGroup = (groupId: number, groupName: string) => {
    if (confirm(`Are you sure you want to delete the group "${groupName}"? This action cannot be undone.`)) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  // Handle manage ACLs
  const handleManageAcls = (groupId: number) => {
    // TODO: Implement ACL management modal
    notifications.show({
      title: 'Coming Soon',
      message: `ACL management functionality will be implemented soon (Group ID: ${groupId})`,
      color: 'blue',
    });
  };

  return (
    <GroupsList
      onCreateGroup={handleCreateGroup}
      onEditGroup={handleEditGroup}
      onDeleteGroup={handleDeleteGroup}
      onManageAcls={handleManageAcls}
    />
  );
} 