"use client";

import { useEffect, useState, useMemo } from 'react';
import { Text, Badge, LoadingOverlay, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUsers } from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared';
import { PermissionsMatrix, type IPermissionRow } from '../shared/PermissionsMatrix';
import { AdminDataAccessApi } from '../../../../../api/admin';
import { LookupsApi } from '../../../../../api/lookups.api';
import type { IRoleEffectivePermissions, ISetRolePermissionsRequest } from '../../../../../types/responses/admin/roles.types';
import type { IGroupDetails } from '../../../../../types/responses/admin/groups.types';
import {
  parseCrudPermissions,
  stringifyCrudPermissions,
  ICrudPermissions,
  DEFAULT_CRUD_PERMISSIONS,
} from '../../../../../utils/permissions.utils';

interface IGroupPermissionsModalProps {
  opened: boolean;
  onClose: () => void;
  roleId: number;
  roleName: string;
}

interface IGroupPermissionRow extends IGroupDetails {
  permissions: ICrudPermissions;
  hasChanges: boolean;
}

// For groups, we care about full CRUD permissions
const GROUP_PERMISSION_TYPES: (keyof ICrudPermissions)[] = ['view', 'create', 'update', 'delete'];

export function GroupPermissionsModal({ opened, onClose, roleId, roleName }: IGroupPermissionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<IGroupDetails[]>([]);
  const [rolePermissions, setRolePermissions] = useState<IRoleEffectivePermissions | null>(null);
  const [permissionRows, setPermissionRows] = useState<IGroupPermissionRow[]>([]);
  const [resourceTypeId, setResourceTypeId] = useState<number | null>(null);

  // Load groups and current permissions
  useEffect(() => {
    if (opened && roleId) {
      loadData();
    }
  }, [opened, roleId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsResponse, permissionsResponse, resourceTypeIdResponse] = await Promise.all([
        AdminDataAccessApi.getAvailableGroups(),
        AdminDataAccessApi.getRoleEffectivePermissions(roleId),
        LookupsApi.getResourceTypeId('group'),
      ]);

      setGroups(groupsResponse);
      setRolePermissions(permissionsResponse);
      setResourceTypeId(resourceTypeIdResponse);

      // Create permission rows combining groups with existing permissions
      const rows: IGroupPermissionRow[] = groupsResponse.map(group => {
        // Find existing permission for this group (resource_type_name === "Group")
        const existingPermission = permissionsResponse.effective_permissions.find(
          p => p.resource_type_name === 'Group' && p.resource_id === group.id
        );

        return {
          ...group,
          permissions: existingPermission && existingPermission.unified_permissions > 0
            ? parseCrudPermissions(existingPermission.unified_permissions)
            : { ...DEFAULT_CRUD_PERMISSIONS },
          hasChanges: false,
        };
      });

      setPermissionRows(rows);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to load group permissions',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update permission for a specific group and permission type
  const updatePermission = (groupId: number, permissionType: keyof ICrudPermissions, value: boolean) => {
    setPermissionRows(prev => prev.map(row => {
      if (row.id === groupId) {
        const newPermissions = { ...row.permissions, [permissionType]: value };
        const originalPermission = rolePermissions?.effective_permissions.find(p => p.resource_type_name === 'Group' && p.resource_id === groupId);
        const originalPermissions = originalPermission && originalPermission.unified_permissions > 0
          ? parseCrudPermissions(originalPermission.unified_permissions)
          : { ...DEFAULT_CRUD_PERMISSIONS };

        // Check if there are changes
        const hasChanges = JSON.stringify(newPermissions) !== JSON.stringify(originalPermissions);

        return {
          ...row,
          permissions: newPermissions,
          hasChanges,
        };
      }
      return row;
    }));
  };

  // Save all changes
  const handleSave = async () => {
    const changedRows = permissionRows.filter(row => row.hasChanges);

    if (changedRows.length === 0) {
      notifications.show({
        title: 'No Changes',
        message: 'No permissions have been modified',
        color: 'blue',
      });
      return;
    }

    setSaving(true);
    try {
      // Prepare bulk permissions request
      // Get all existing permissions for other resource types
      const allPermissions = rolePermissions?.effective_permissions || [];

      // Create a map of current group permissions (both changed and unchanged)
      const groupPermissionsMap = new Map<number, number>();
      permissionRows.forEach(row => {
        const permissionData = stringifyCrudPermissions(row.permissions);
        groupPermissionsMap.set(row.id, permissionData);
      });

      // Build the permissions array for bulk update
      const permissions: Array<{
        resource_type_id: number;
        resource_id: number;
        crud_permissions: number;
      }> = [];

      // Add group permissions
      groupPermissionsMap.forEach((crudPermissions, resourceId) => {
        if (resourceTypeId) {
          permissions.push({
            resource_type_id: resourceTypeId, // Groups
            resource_id: resourceId,
            crud_permissions: crudPermissions,
          });
        }
      });

      // Add all other existing permissions (pages, data tables, etc.)
      allPermissions.forEach(perm => {
        // Skip if it's a group permission (we already handled those above)
        if (perm.resource_type_name === 'Group') return;

        permissions.push({
          resource_type_id: perm.id_resourceTypes,
          resource_id: perm.resource_id,
          crud_permissions: perm.unified_permissions,
        });
      });

      const request: ISetRolePermissionsRequest = { permissions };

      await AdminDataAccessApi.setRolePermissions(roleId, request);

      notifications.show({
        title: 'Success',
        message: 'Group permissions updated successfully',
        color: 'green',
      });

      onClose();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to save group permissions',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  // Check if any row has changes
  const hasChanges = useMemo(() => permissionRows.some(row => row.hasChanges), [permissionRows]);

  // Transform permission rows for the matrix component
  const matrixRows: IPermissionRow[] = useMemo(() =>
    permissionRows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      permissions: row.permissions,
      hasChanges: row.hasChanges,
      badges: [
        ...(row.id_group_types ? [{ label: `Type ${row.id_group_types}`, color: 'blue', variant: 'light' as const }] : []),
        ...(row.requires_2fa ? [{ label: '2FA', color: 'orange', variant: 'light' as const }] : []),
      ],
      extraInfo: (
        <Text size="xs" c="dimmed">
          {row.users_count} members
        </Text>
      ),
    })), [permissionRows]
  );

  // Render functions for the matrix
  const renderNameCell = (row: IPermissionRow) => (
    <div>
      <Text size="sm" fw={500}>
        {row.name}
      </Text>
      {row.description && (
        <Text size="xs" c="dimmed">
          {row.description}
        </Text>
      )}
    </div>
  );

  const renderInfoCell = (row: IPermissionRow) => (
    <Group gap="xs">
      {row.badges?.map((badge, index) => (
        <Badge key={index} size="xs" color={badge.color} variant={badge.variant}>
          {badge.label}
        </Badge>
      ))}
      {row.extraInfo}
    </Group>
  );

  const renderStatusCell = (row: IPermissionRow) => (
    row.hasChanges ? (
      <Text size="xs" c="orange" fw={500}>Unsaved</Text>
    ) : row.existingPermissionId ? (
      <Text size="xs" c="green" fw={500}>Set</Text>
    ) : (
      <Text size="xs" c="dimmed">None</Text>
    )
  );

  return (
    <ModalWrapper
      opened={opened}
      onClose={onClose}
      title={`Group Permissions for Role: ${roleName}`}
      size="90vw"
      onSave={handleSave}
      onCancel={onClose}
      isLoading={saving}
      saveLabel="Save Permissions"
      cancelLabel="Cancel"
      scrollAreaHeight="90vh"
      modalStyles={{
        content: { height: '90vh' },
      }}
    >
      <LoadingOverlay visible={loading} />

      {!loading && (
        <PermissionsMatrix
          title="Groups"
          icon={<IconUsers size={16} />}
          permissionRows={matrixRows}
          permissionColumns={GROUP_PERMISSION_TYPES}
          searchPlaceholder="Search groups by name or description..."
          onPermissionChange={(rowId, permission, value) => updatePermission(Number(rowId), permission, value)}
          renderNameCell={renderNameCell}
          renderInfoCell={renderInfoCell}
          renderStatusCell={renderStatusCell}
        />
      )}
    </ModalWrapper>
  );
}
