/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useCallback, useEffect, useState } from 'react';
import { LoadingOverlay, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPuzzle } from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared';
import { PermissionsMatrix, type IPermissionRow } from '../shared/PermissionsMatrix';
import { AdminDataAccessApi } from '../../../../../api/admin';
import type {
  IPluginResourceType,
  IRoleEffectivePermissions,
  ISetRolePermissionsRequest,
} from '../../../../../types/responses/admin/roles.types';
import {
  DEFAULT_CRUD_PERMISSIONS,
  parseCrudPermissions,
  stringifyCrudPermissions,
  type ICrudPermissions,
} from '../../../../../utils/permissions.utils';
import { getApiErrorText } from '../../../../../utils/mutation-error-handler';

interface IPluginResourcePermissionsModalProps {
  opened: boolean;
  onClose: () => void;
  roleId: number;
  roleName: string;
  /** The plugin's resource type, e.g. surveys. */
  resourceType: IPluginResourceType;
}

const PERMISSION_COLUMNS: (keyof ICrudPermissions)[] = ['view', 'create', 'update', 'delete'];

/**
 * Grants of one role on the resources of a plugin's data-access resource type
 * (for example every survey), next to the page, data table and group grants.
 * The plugin lists the resources; the grants are stored like every other
 * role grant and saved with the role's full permission set.
 */
export function PluginResourcePermissionsModal({ opened, onClose, roleId, roleName, resourceType }: IPluginResourcePermissionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<IRoleEffectivePermissions | null>(null);
  const [rows, setRows] = useState<IPermissionRow[]>([]);

  const storedPermissionsOf = useCallback(
    (permissions: IRoleEffectivePermissions | null, resourceId: number): ICrudPermissions => {
      const stored = permissions?.effective_permissions.find(
        p => p.id_resource_types === resourceType.id && p.resource_id === resourceId
      );
      return stored && stored.unified_permissions > 0 ? parseCrudPermissions(stored.unified_permissions) : { ...DEFAULT_CRUD_PERMISSIONS };
    },
    [resourceType.id]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resources, permissions] = await Promise.all([
        AdminDataAccessApi.getPluginResources(resourceType.code),
        AdminDataAccessApi.getRoleEffectivePermissions(roleId),
      ]);
      setRolePermissions(permissions);
      setRows(resources.map(resource => ({
        id: resource.id,
        name: resource.name,
        description: resource.description ?? undefined,
        permissions: storedPermissionsOf(permissions, resource.id),
        hasChanges: false,
      })));
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: getApiErrorText(error) || `Failed to load ${resourceType.label} permissions`,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [resourceType.code, resourceType.label, roleId, storedPermissionsOf]);

  useEffect(() => {
    if (opened && roleId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- loadData performs asynchronous data fetching when the modal opens; its loading-state management is part of that async fetch lifecycle (canonical data-fetch effect, as in the other role permission modals).
      void loadData();
    }
  }, [opened, roleId, loadData]);

  const updatePermission = (rowId: number | string, permission: keyof ICrudPermissions, value: boolean) => {
    setRows(previous => previous.map(row => {
      if (row.id !== rowId) {
        return row;
      }
      const permissions = { ...row.permissions, [permission]: value };
      const stored = storedPermissionsOf(rolePermissions, Number(row.id));
      return { ...row, permissions, hasChanges: JSON.stringify(permissions) !== JSON.stringify(stored) };
    }));
  };

  const handleSave = async () => {
    if (!rows.some(row => row.hasChanges)) {
      notifications.show({ title: 'No Changes', message: 'No permissions have been modified', color: 'blue' });
      return;
    }

    // The endpoint replaces the role's whole permission set: send this
    // type's rows and keep every grant of other types as it is.
    const permissions: ISetRolePermissionsRequest['permissions'] = rows.map(row => ({
      resource_type_id: resourceType.id,
      resource_id: Number(row.id),
      crud_permissions: stringifyCrudPermissions(row.permissions),
    }));
    (rolePermissions?.effective_permissions ?? [])
      .filter(p => p.id_resource_types !== resourceType.id)
      .forEach(p => permissions.push({
        resource_type_id: p.id_resource_types,
        resource_id: p.resource_id,
        crud_permissions: p.unified_permissions,
      }));

    setSaving(true);
    try {
      await AdminDataAccessApi.setRolePermissions(roleId, { permissions });
      notifications.show({ title: 'Success', message: `${resourceType.label} permissions updated successfully`, color: 'green' });
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: getApiErrorText(error) || `Failed to save ${resourceType.label} permissions`,
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const renderNameCell = (row: IPermissionRow) => (
    <div>
      <Text size="sm" fw={500}>{row.name}</Text>
      {row.description && <Text size="xs" c="dimmed">{row.description}</Text>}
    </div>
  );

  const renderStatusCell = (row: IPermissionRow) => (
    row.hasChanges ? <Text size="xs" c="orange" fw={500}>Unsaved</Text> : null
  );

  const emptyHint = !loading && rows.length === 0;

  return (
    <ModalWrapper
      opened={opened}
      onClose={onClose}
      title={`${resourceType.label} Permissions for Role: ${roleName}`}
      size="90vw"
      onSave={handleSave}
      onCancel={onClose}
      isLoading={saving}
      saveLabel="Save Permissions"
      cancelLabel="Cancel"
      scrollAreaHeight="90vh"
      modalStyles={{ content: { height: '90vh' } }}
    >
      <LoadingOverlay visible={loading} />
      {emptyHint && (
        <Text size="sm" c="dimmed">No {resourceType.label.toLowerCase()} exist yet.</Text>
      )}
      {!loading && rows.length > 0 && (
        <PermissionsMatrix
          title={resourceType.label}
          icon={<IconPuzzle size={16} />}
          permissionRows={rows}
          permissionColumns={PERMISSION_COLUMNS}
          searchPlaceholder={`Search ${resourceType.label.toLowerCase()} by name...`}
          onPermissionChange={updatePermission}
          renderNameCell={renderNameCell}
          renderInfoCell={() => null}
          renderStatusCell={renderStatusCell}
        />
      )}
    </ModalWrapper>
  );
}
