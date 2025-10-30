"use client";

import { useState } from 'react';
import { RolesList } from '../roles-list/RolesList';
import { RoleFormModal } from '../role-form-modal/RoleFormModal';
import { DeleteRoleModal } from '../delete-role-modal/DeleteRoleModal';
import { PagePermissionsModal } from '../page-permissions-modal/PagePermissionsModal';
import { DataTablePermissionsModal } from '../datatable-permissions-modal/DataTablePermissionsModal';
import { GroupPermissionsModal } from '../group-permissions-modal/GroupPermissionsModal';
import { useDeleteRole } from '../../../../../hooks/useRoles';
import { notifications } from '@mantine/notifications';

export function RolesPage() {
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [deletingRole, setDeletingRole] = useState<{ id: number; name: string } | null>(null);

  // Permission modals state
  const [pagePermissionsModalOpened, setPagePermissionsModalOpened] = useState(false);
  const [dataTablePermissionsModalOpened, setDataTablePermissionsModalOpened] = useState(false);
  const [groupPermissionsModalOpened, setGroupPermissionsModalOpened] = useState(false);
  const [managingPermissionsRole, setManagingPermissionsRole] = useState<{ id: number; name: string } | null>(null);
  
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

  // Handle manage page permissions
  const handleManagePagePermissions = (roleId: number, roleName: string) => {
    setManagingPermissionsRole({ id: roleId, name: roleName });
    setPagePermissionsModalOpened(true);
  };

  // Handle manage data table permissions
  const handleManageDataTablePermissions = (roleId: number, roleName: string) => {
    setManagingPermissionsRole({ id: roleId, name: roleName });
    setDataTablePermissionsModalOpened(true);
  };

  // Handle manage group permissions
  const handleManageGroupPermissions = (roleId: number, roleName: string) => {
    setManagingPermissionsRole({ id: roleId, name: roleName });
    setGroupPermissionsModalOpened(true);
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

  // Handle permission modal close
  const handleClosePagePermissionsModal = () => {
    setPagePermissionsModalOpened(false);
    setManagingPermissionsRole(null);
  };

  const handleCloseDataTablePermissionsModal = () => {
    setDataTablePermissionsModalOpened(false);
    setManagingPermissionsRole(null);
  };

  const handleCloseGroupPermissionsModal = () => {
    setGroupPermissionsModalOpened(false);
    setManagingPermissionsRole(null);
  };

  return (
    <>
      <RolesList
        onCreateRole={handleCreateRole}
        onEditRole={handleEditRole}
        onDeleteRole={handleDeleteRole}
        onManagePagePermissions={handleManagePagePermissions}
        onManageDataTablePermissions={handleManageDataTablePermissions}
        onManageGroupPermissions={handleManageGroupPermissions}
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

      {/* Page Permissions Modal */}
      <PagePermissionsModal
        opened={pagePermissionsModalOpened}
        onClose={handleClosePagePermissionsModal}
        roleId={managingPermissionsRole?.id || 0}
        roleName={managingPermissionsRole?.name || ''}
      />

      {/* Data Table Permissions Modal */}
      <DataTablePermissionsModal
        opened={dataTablePermissionsModalOpened}
        onClose={handleCloseDataTablePermissionsModal}
        roleId={managingPermissionsRole?.id || 0}
        roleName={managingPermissionsRole?.name || ''}
      />

      {/* Group Permissions Modal */}
      <GroupPermissionsModal
        opened={groupPermissionsModalOpened}
        onClose={handleCloseGroupPermissionsModal}
        roleId={managingPermissionsRole?.id || 0}
        roleName={managingPermissionsRole?.name || ''}
      />
    </>
  );
} 