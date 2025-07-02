"use client";

import { useState } from 'react';
import { GroupsList } from '../groups-list/GroupsList';
import { GroupFormModal } from '../group-form-modal/GroupFormModal';
import { DeleteGroupModal } from '../delete-group-modal/DeleteGroupModal';
import { AdvancedAclModal } from '../advanced-acl-modal/AdvancedAclModal';
import { useDeleteGroup } from '../../../../../hooks/useGroups';
import { notifications } from '@mantine/notifications';

export function GroupsPage() {
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [advancedAclModalOpened, setAdvancedAclModalOpened] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<{ id: number; name: string } | null>(null);
  const [managingAclGroup, setManagingAclGroup] = useState<{ id: number; name: string } | null>(null);
  
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
    setDeletingGroup({ id: groupId, name: groupName });
    setDeleteModalOpened(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (deletingGroup) {
      deleteGroupMutation.mutate(deletingGroup.id, {
        onSuccess: () => {
          notifications.show({
            title: 'Success',
            message: 'Group deleted successfully',
            color: 'green',
          });
          setDeleteModalOpened(false);
          setDeletingGroup(null);
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
  };

  // Handle manage ACLs
  const handleManageAcls = (groupId: number, groupName: string) => {
    setManagingAclGroup({ id: groupId, name: groupName });
    setAdvancedAclModalOpened(true);
  };

  // Handle modal close
  const handleCloseCreateModal = () => {
    setCreateModalOpened(false);
  };

  const handleCloseEditModal = () => {
    setEditModalOpened(false);
    setEditingGroupId(null);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpened(false);
    setDeletingGroup(null);
  };

  const handleCloseAdvancedAclModal = () => {
    setAdvancedAclModalOpened(false);
    setManagingAclGroup(null);
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
        onAdvancedAcls={handleManageAcls}
      />

      {/* Delete Group Modal */}
      <DeleteGroupModal
        opened={deleteModalOpened}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        groupName={deletingGroup?.name || ''}
        isLoading={deleteGroupMutation.isPending}
      />

      {/* Advanced ACL Management Modal */}
      {managingAclGroup && (
        <AdvancedAclModal
          opened={advancedAclModalOpened}
          onClose={handleCloseAdvancedAclModal}
          groupId={managingAclGroup.id}
          groupName={managingAclGroup.name}
        />
      )}
    </>
  );
} 