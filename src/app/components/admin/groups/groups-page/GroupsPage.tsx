"use client";

import { useState } from 'react';
import { GroupsList } from '../groups-list/GroupsList';
import { GroupFormModal } from '../group-form-modal/GroupFormModal';
import { useDeleteGroup } from '../../../../../hooks/useGroups';
import { notifications } from '@mantine/notifications';

export function GroupsPage() {
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  
  const deleteGroupMutation = useDeleteGroup();

  // Handle create group
  const handleCreateGroup = () => {
    setCreateModalOpened(true);
  };

  // Handle edit group
  const handleEditGroup = (groupId: number) => {
    setEditingGroupId(groupId);
    setEditModalOpened(true);
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

  // Handle modal close
  const handleCloseCreateModal = () => {
    setCreateModalOpened(false);
  };

  const handleCloseEditModal = () => {
    setEditModalOpened(false);
    setEditingGroupId(null);
  };

  return (
    <>
      <GroupsList
        onCreateGroup={handleCreateGroup}
        onEditGroup={handleEditGroup}
        onDeleteGroup={handleDeleteGroup}
        onManageAcls={handleManageAcls}
      />

      {/* Create Group Modal */}
      <GroupFormModal
        opened={createModalOpened}
        onClose={handleCloseCreateModal}
        mode="create"
      />

      {/* Edit Group Modal */}
      <GroupFormModal
        opened={editModalOpened}
        onClose={handleCloseEditModal}
        groupId={editingGroupId}
        mode="edit"
      />
    </>
  );
} 