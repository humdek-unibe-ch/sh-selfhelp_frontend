/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useEffect, useMemo } from 'react';
import { useForm } from '@mantine/form';
import {
  Stack,
  TextInput,
  Textarea,
  Group,
  Grid,
  Text,
  LoadingOverlay,
} from '@mantine/core';
import { useCreateRole, useUpdateRole, useRoleDetails } from '../../../../../hooks/useRoles';
import { usePermissions } from '../../../../../hooks/usePermissions';
import { useAuthUser } from '../../../../../hooks/useUserData';
import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';
import type { ICreateRoleRequest, IUpdateRoleRequest } from '../../../../../types/requests/admin/roles.types';
import { ModalWrapper } from '../../../shared';
import { buildPermissionOptions, withImpliedReads } from './permission-picker.utils';
import { RolePermissionGrid } from './RolePermissionGrid';

interface IRoleFormModalProps {
  opened: boolean;
  onClose: () => void;
  roleId?: number | null;
  mode: 'create' | 'edit';
}

interface IRoleFormValues {
  name: string;
  description: string;
  permission_ids: string[];
}

// The server's own refusal texts: what a person reads here is what they would be told
// if they forced the call.
const TEXT_NEEDS_PERMISSIONS = "Changing a role's permissions needs admin.role.permissions.";
const TEXT_ROLE_NOT_HELD = 'You can only change or delete a role whose rights you all hold.';

export function RoleFormModal({ opened, onClose, roleId, mode }: IRoleFormModalProps) {
  // Hooks
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const { data: roleDetails, isLoading: isLoadingRole } = useRoleDetails(roleId || 0);
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissions();
  const { permissionChecker } = useAuthUser();

  // The permission list of a role is its own right: without it the picker is only
  // shown, and the request leaves the list out (the server treats any list as a change).
  const mayChangePermissionList = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ROLE_PERMISSIONS) ?? false;
  // Whether this role may be changed by the signed-in person is sent with the role.
  const roleLocked = mode === 'edit' && roleDetails !== undefined && roleDetails.can_update !== true;

  // Form
  const form = useForm<IRoleFormValues>({
    initialValues: {
      name: '',
      description: '',
      permission_ids: [],
    },
    validate: {
      name: (value) => {
        if (mode === 'edit') return null; // Skip validation in edit mode
        return !value ? 'Role name is required' : null;
      },
    },
    transformValues: (values) => ({
      ...values,
      permission_ids: values.permission_ids || [],
    }),
  });

  // Reset form when modal closes or mode changes
  useEffect(() => {
    if (!opened) {
      form.setValues({
        name: '',
        description: '',
        permission_ids: [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional reset-on-close; `form` is a fresh object each render, so depending on it would re-run every render and clobber edits. `form.setValues` is stable.
  }, [opened]);

  // Load role data for editing - runs when modal opens in edit mode or when roleDetails changes
  useEffect(() => {
    if (mode === 'edit' && opened && roleDetails) {
      form.setValues({
        name: roleDetails.name || '',
        description: roleDetails.description || '',
        permission_ids: roleDetails.permissions?.map((p) => p.id.toString()) || [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional init-on-edit; `form` is a fresh object each render, so depending on it would re-run every render and clobber edits. `form.setValues` is stable.
  }, [mode, opened, roleDetails]);

  const permissions = useMemo(() => {
    const list = permissionsData?.permissions;
    return Array.isArray(list) ? list : [];
  }, [permissionsData]);

  // What the picker shows: every ticked right together with the read right of its area
  // (the server adds it as well), whatever order the role and the permission list arrived in.
  const selectedPermissionIds = useMemo(
    () => withImpliedReads(form.values.permission_ids, permissions),
    [form.values.permission_ids, permissions],
  );

  // Prepare permission options
  const permissionOptions = useMemo(
    () => buildPermissionOptions(permissions, selectedPermissionIds),
    [permissions, selectedPermissionIds],
  );

  const handlePermissionsChange = (values: string[]) => {
    form.setFieldValue('permission_ids', withImpliedReads(values, permissions));
  };

  // Handle form submission
  const handleSubmit = async (values: IRoleFormValues) => {
    try {
      const roleData = {
        name: values.name,
        description: values.description || undefined,
        ...(mayChangePermissionList
          ? { permission_ids: withImpliedReads(values.permission_ids || [], permissions).map((id) => parseInt(id, 10)) }
          : {}),
      };

      if (mode === 'create') {
        const createData: ICreateRoleRequest = {
          ...roleData,
        };
        await createRoleMutation.mutateAsync(createData);
      } else if (roleId) {
        const updateData: IUpdateRoleRequest = {
          ...roleData,
        };
        await updateRoleMutation.mutateAsync({ roleId, data: updateData });
      }

      onClose();
    } catch {
      // The mutation hooks show the success and error toasts; the modal
      // stays open so the name can be corrected.
    }
  };

  const isLoading = isLoadingRole || isLoadingPermissions;
  const isSubmitting = createRoleMutation.isPending || updateRoleMutation.isPending;
  // Not while the role or the permission list is still being read: the form would send
  // what it has so far, and an empty permission list replaces the role's own.
  const saveDisabled = roleLocked || isLoading;

  const handleSave = () => {
    form.onSubmit(handleSubmit)();
  };

  return (
    <ModalWrapper
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? 'Create New Role' : 'Edit Role'}
      size={1000}
      onSave={handleSave}
      onCancel={onClose}
      isLoading={isSubmitting}
      disabled={saveDisabled}
      saveLabel={mode === 'create' ? 'Create Role' : 'Update Role'}
      cancelLabel="Cancel"
    >
      <LoadingOverlay visible={isLoading} />
      
      {/* Identity on top, the permission grid below it; only the grid scrolls. */}
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid gap="xl">
            <Grid.Col span={{ base: 12, sm: 5 }}>
              {mode === 'edit' && roleDetails && (
                <Group>
                  <Text size="sm" fw={500} c="dimmed" className="min-w-[80px]">
                    Name:
                  </Text>
                  <Text size="sm">
                    {roleDetails.name}
                  </Text>
                </Group>
              )}
              {mode === 'create' && (
                <TextInput
                  label="Role Name"
                  placeholder="Enter role name"
                  required
                  autoComplete="off"
                  {...form.getInputProps('name')}
                />
              )}
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 7 }}>
              <Textarea
                label="Description"
                placeholder="Enter role description"
                autosize
                minRows={1}
                maxRows={3}
                disabled={roleLocked}
                {...form.getInputProps('description')}
              />
            </Grid.Col>
          </Grid>

          <Stack gap={4}>
            <Text size="sm" fw={500}>Role Permissions</Text>
            <Text size="xs" c="dimmed">
              {roleLocked
                ? TEXT_ROLE_NOT_HELD
                : !mayChangePermissionList
                  ? TEXT_NEEDS_PERMISSIONS
                  : 'Tick what users with this role may do. You can only give permissions you hold yourself '
                    + '(others are greyed out); Read stays ticked while another right of its area is ticked.'}
            </Text>
          </Stack>
          <RolePermissionGrid
            options={permissionOptions}
            value={selectedPermissionIds}
            onChange={handlePermissionsChange}
            disabled={isLoading || roleLocked || !mayChangePermissionList}
          />
        </Stack>
      </form>
    </ModalWrapper>
  );
}
