"use client";

import { useState } from 'react';
import { RolesList } from '../roles-list/RolesList';
import { useDeleteRole } from '../../../../../hooks/useRoles';
import { notifications } from '@mantine/notifications';

export function RolesPage() {
  const deleteRoleMutation = useDeleteRole();

  // Handle create role
  const handleCreateRole = () => {
    // TODO: Implement create role modal
    notifications.show({
      title: 'Coming Soon',
      message: 'Create role functionality will be implemented soon',
      color: 'blue',
    });
  };

  // Handle edit role
  const handleEditRole = (roleId: number) => {
    // TODO: Implement edit role modal
    notifications.show({
      title: 'Coming Soon',
      message: `Edit role functionality will be implemented soon (Role ID: ${roleId})`,
      color: 'blue',
    });
  };

  // Handle delete role
  const handleDeleteRole = (roleId: number, roleName: string) => {
    if (confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      deleteRoleMutation.mutate(roleId);
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

  return (
    <RolesList
      onCreateRole={handleCreateRole}
      onEditRole={handleEditRole}
      onDeleteRole={handleDeleteRole}
      onManagePermissions={handleManagePermissions}
    />
  );
} 