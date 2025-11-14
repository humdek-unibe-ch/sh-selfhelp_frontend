"use client";

import { useEffect, useState, useMemo } from 'react';
import { Text, LoadingOverlay } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDatabase } from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared';
import { PermissionsMatrix, type IPermissionRow } from '../shared/PermissionsMatrix';
import { AdminDataAccessApi } from '../../../../../api/admin';
import { LookupsApi } from '../../../../../api/lookups.api';
import type { IRoleEffectivePermissions, ISetRolePermissionsRequest } from '../../../../../types/responses/admin/roles.types';
import type { IDataTableSummary } from '../../../../../types/responses/admin/data.types';
import {
  parseCrudPermissions,
  stringifyCrudPermissions,
  ICrudPermissions,
  DEFAULT_CRUD_PERMISSIONS,
} from '../../../../../utils/permissions.utils';

interface IDataTablePermissionsModalProps {
  opened: boolean;
  onClose: () => void;
  roleId: number;
  roleName: string;
}

interface IDataTablePermissionRow extends IDataTableSummary {
  permissions: ICrudPermissions;
  hasChanges: boolean;
}

export function DataTablePermissionsModal({ opened, onClose, roleId, roleName }: IDataTablePermissionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataTables, setDataTables] = useState<IDataTableSummary[]>([]);
  const [rolePermissions, setRolePermissions] = useState<IRoleEffectivePermissions | null>(null);
  const [permissionRows, setPermissionRows] = useState<IDataTablePermissionRow[]>([]);
  const [resourceTypeId, setResourceTypeId] = useState<number | null>(null);

  // Load data tables and current permissions
  useEffect(() => {
    if (opened && roleId) {
      loadData();
    }
  }, [opened, roleId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dataTablesResponse, permissionsResponse, resourceTypeIdResponse] = await Promise.all([
        AdminDataAccessApi.getAvailableDataTables(),
        AdminDataAccessApi.getRoleEffectivePermissions(roleId),
        LookupsApi.getResourceTypeId('data_table'),
      ]);

      setDataTables(dataTablesResponse);
      setRolePermissions(permissionsResponse);
      setResourceTypeId(resourceTypeIdResponse);

      // Create permission rows combining data tables with existing permissions
      const rows: IDataTablePermissionRow[] = dataTablesResponse.map(table => {
        // Find existing permission for this data table (resource_type_name should match data tables)
        const existingPermission = permissionsResponse.effective_permissions.find(
          p => p.resource_type_name === 'Data Table' && p.resource_id === table.id
        );

        return {
          ...table,
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
        message: error.response?.data?.message || 'Failed to load data table permissions',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update permission for a specific data table and permission type
  const updatePermission = (tableName: string, permissionType: keyof ICrudPermissions, value: boolean) => {
    setPermissionRows(prev => prev.map(row => {
      if (row.name === tableName) {
        const newPermissions = { ...row.permissions, [permissionType]: value };
        const originalPermission = rolePermissions?.effective_permissions.find(p => p.resource_type_name === 'Data Table' && p.resource_id === row.id);
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

      // Create a map of current data table permissions (both changed and unchanged)
      const dataTablePermissionsMap = new Map<number, number>();
      permissionRows.forEach(row => {
        const permissionData = stringifyCrudPermissions(row.permissions);
        dataTablePermissionsMap.set(row.id, permissionData);
      });

      // Build the permissions array for bulk update
      const permissions: Array<{
        resource_type_id: number;
        resource_id: number;
        crud_permissions: number;
      }> = [];

      // Add data table permissions
      dataTablePermissionsMap.forEach((crudPermissions, resourceId) => {
        if (resourceTypeId) {
          permissions.push({
            resource_type_id: resourceTypeId, // Data Tables
            resource_id: resourceId,
            crud_permissions: crudPermissions,
          });
        }
      });

      // Add all other existing permissions (pages, groups, etc.)
      allPermissions.forEach(perm => {
        // Skip if it's a data table permission (we already handled those above)
        if (perm.resource_type_name === 'Data Table') return;

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
        message: 'Data table permissions updated successfully',
        color: 'green',
      });

      onClose();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to save data table permissions',
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
      displayName: row.displayName || undefined,
      permissions: row.permissions,
      hasChanges: row.hasChanges,
    })), [permissionRows]
  );

  // Permission columns (View, Create, Update, Delete only for data tables)
  const permissionColumns: (keyof ICrudPermissions)[] = ['view', 'create', 'update', 'delete'];

  // Render functions for the matrix
  const renderNameCell = (row: IPermissionRow) => (
    <div>
      <Text size="sm" fw={500}>
        {row.displayName || row.name}
      </Text>
      {row.displayName && row.name !== row.displayName && (
        <Text size="xs" c="dimmed">
          ID: {row.name}
        </Text>
      )}
    </div>
  );

  const renderInfoCell = (row: IPermissionRow) => null; // No additional info for data tables

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
      title={`Data Table Permissions for Role: ${roleName}`}
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
          title="Data Tables"
          icon={<IconDatabase size={16} />}
          permissionRows={matrixRows}
          permissionColumns={permissionColumns}
          searchPlaceholder="Search data tables by name or display name..."
          onPermissionChange={(rowId, permission, value) => {
            const row = permissionRows.find(r => r.id === rowId);
            if (row) updatePermission(row.name, permission, value);
          }}
          renderNameCell={renderNameCell}
          renderInfoCell={renderInfoCell}
          renderStatusCell={renderStatusCell}
        />
      )}
    </ModalWrapper>
  );
}
