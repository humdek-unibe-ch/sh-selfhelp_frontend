"use client";

import { useState } from 'react';
import { RolesList } from '../roles-list/RolesList';
import { RoleFormModal } from '../role-form-modal/RoleFormModal';
import { DeleteRoleModal } from '../delete-role-modal/DeleteRoleModal';
import { useDeleteRole } from '../../../../../hooks/useRoles';
import { notifications } from '@mantine/notifications';

export function RolesPage() {
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [deletingRole, setDeletingRole] = useState<{ id: number; name: string } | null>(null);
  
  const deleteRoleMutation = useDeleteRole();

  // Handle create role
  const handleCreateRole = () => {
    setCreateModalOpened(true);
  };

  // Handle edit role
  const handleEditRole = (roleId: number) => {
    setEditingRoleId(roleId);
    setEditModalOpened(true);
  };

  // Handle delete role
  const handleDeleteRole = (roleId: number, roleName: string) => {
    setDeletingRole({ id: roleId, name: roleName });
    setDeleteModalOpened(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (deletingRole) {
      deleteRoleMutation.mutate(deletingRole.id, {
        onSuccess: () => {
          notifications.show({
            title: 'Success',
            message: 'Role deleted successfully',
            color: 'green',
          });
          setDeleteModalOpened(false);
          setDeletingRole(null);
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
  };

  // Handle manage permissions
  const handleManagePermissions = (roleId: number) => {
    // TODO: Implement permission management modal
    notifications.show({
      title: 'Coming Soon',
      message: `Permission management functionality will be implemented soon (Role ID: ${roleId})`,
      color: 'blue',
    });
  };

  // Handle modal close
  const handleCloseCreateModal = () => {
    setCreateModalOpened(false);
  };

  const handleCloseEditModal = () => {
    setEditModalOpened(false);
    setEditingRoleId(null);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpened(false);
    setDeletingRole(null);
  };

  return (
    <>
      <RolesList
        onCreateRole={handleCreateRole}
        onEditRole={handleEditRole}
        onDeleteRole={handleDeleteRole}
        onManagePermissions={handleManagePermissions}
      />

      {/* Create Role Modal */}
      <RoleFormModal
        opened={createModalOpened}
        onClose={handleCloseCreateModal}
        mode="create"
      />

      {/* Edit Role Modal */}
      <RoleFormModal
        opened={editModalOpened}
        onClose={handleCloseEditModal}
        roleId={editingRoleId}
        mode="edit"
      />

      {/* Delete Role Modal */}
      <DeleteRoleModal
        opened={deleteModalOpened}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        roleName={deletingRole?.name || ''}
        isLoading={deleteRoleMutation.isPending}
      />
    </>
  );
} 