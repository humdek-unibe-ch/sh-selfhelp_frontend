"use client";

import { useEffect, useState, useMemo } from 'react';
import { Text, Badge, LoadingOverlay, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconFileText } from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared';
import { PermissionsMatrix, type IPermissionRow } from '../shared/PermissionsMatrix';
import { AdminDataAccessApi } from '../../../../../api/admin';
import { LookupsApi } from '../../../../../api/lookups.api';
import type { IRoleEffectivePermissions, ISetRolePermissionsRequest } from '../../../../../types/responses/admin/roles.types';
import type { IAdminPage } from '../../../../../types/responses/admin/admin.types';
import {
  parseCrudPermissions,
  stringifyCrudPermissions,
  ICrudPermissions,
  DEFAULT_CRUD_PERMISSIONS,
} from '../../../../../utils/permissions.utils';

interface IPagePermissionsModalProps {
  opened: boolean;
  onClose: () => void;
  roleId: number;
  roleName: string;
}

interface IPagePermissionRow extends IAdminPage {
  permissions: ICrudPermissions;
  hasChanges: boolean;
}

export function PagePermissionsModal({ opened, onClose, roleId, roleName }: IPagePermissionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState<IAdminPage[]>([]);
  const [rolePermissions, setRolePermissions] = useState<IRoleEffectivePermissions | null>(null);
  const [permissionRows, setPermissionRows] = useState<IPagePermissionRow[]>([]);
  const [resourceTypeId, setResourceTypeId] = useState<number | null>(null);

  // Load pages and current permissions
  useEffect(() => {
    if (opened && roleId) {
      loadData();
    }
  }, [opened, roleId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pagesResponse, permissionsResponse, resourceTypeIdResponse] = await Promise.all([
        AdminDataAccessApi.getAvailablePages(),
        AdminDataAccessApi.getRoleEffectivePermissions(roleId),
        LookupsApi.getResourceTypeId('pages'),
      ]);

      setPages(pagesResponse);
      setRolePermissions(permissionsResponse);
      setResourceTypeId(resourceTypeIdResponse);

      // Create permission rows combining pages with existing permissions
      const rows: IPagePermissionRow[] = pagesResponse.map(page => {
        // Find existing permission for this page (resource_type_name === "Pages")
        const existingPermission = permissionsResponse.effective_permissions.find(
          p => p.resource_type_name === 'Pages' && p.resource_id === page.id_pages
        );

        return {
          ...page,
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
        message: error.response?.data?.message || 'Failed to load page permissions',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update permission for a specific page and permission type
  const updatePermission = (pageId: number, permissionType: keyof ICrudPermissions, value: boolean) => {
    setPermissionRows(prev => prev.map(row => {
      if (row.id_pages === pageId) {
        const newPermissions = { ...row.permissions, [permissionType]: value };
        const originalPermission = rolePermissions?.effective_permissions.find(p => p.resource_type_name === 'Pages' && p.resource_id === pageId);
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

      // Create a map of current page permissions (both changed and unchanged)
      const pagePermissionsMap = new Map<number, number>();
      permissionRows.forEach(row => {
        const permissionData = stringifyCrudPermissions(row.permissions);
        pagePermissionsMap.set(row.id_pages, permissionData);
      });

      // Build the permissions array for bulk update
      const permissions: Array<{
        resource_type_id: number;
        resource_id: number;
        crud_permissions: number;
      }> = [];

      // Add page permissions
      pagePermissionsMap.forEach((crudPermissions, resourceId) => {
        if (resourceTypeId) {
          permissions.push({
            resource_type_id: resourceTypeId, // Pages
            resource_id: resourceId,
            crud_permissions: crudPermissions,
          });
        }
      });

      // Add all other existing permissions (groups, data tables, etc.)
      allPermissions.forEach(perm => {
        // Skip if it's a page permission (we already handled those above)
        if (perm.resource_type_name === 'Pages') return;

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
        message: 'Page permissions updated successfully',
        color: 'green',
      });

      onClose();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to save page permissions',
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
      id: row.id_pages,
      name: row.keyword || '',
      displayName: row.title || undefined,
      permissions: row.permissions,
      hasChanges: row.hasChanges,
      badges: [
        ...(row.is_system === 1 ? [{ label: 'System', color: 'blue', variant: 'light' as const }] : []),
        ...(row.is_headless === 1 ? [{ label: 'Headless', color: 'gray', variant: 'light' as const }] : []),
      ],
    })), [permissionRows]
  );

  // Permission columns (View, Create, Update, Delete only for pages)
  const permissionColumns: (keyof ICrudPermissions)[] = ['view', 'create', 'update', 'delete'];

  // Render functions for the matrix
  const renderNameCell = (row: IPermissionRow) => (
    <div>
      <Text size="sm" fw={500}>
        {row.displayName || row.name}
      </Text>
      {row.displayName && row.name !== row.displayName && (
        <Text size="xs" c="dimmed">
          {row.name}
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
      title={`Page Permissions for Role: ${roleName}`}
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
          title="Pages"
          icon={<IconFileText size={16} />}
          permissionRows={matrixRows}
          permissionColumns={permissionColumns}
          searchPlaceholder="Search pages by name or keyword..."
          onPermissionChange={(rowId, permission, value) => updatePermission(Number(rowId), permission, value)}
          renderNameCell={renderNameCell}
          renderInfoCell={renderInfoCell}
          renderStatusCell={renderStatusCell}
        />
      )}
    </ModalWrapper>
  );
}
