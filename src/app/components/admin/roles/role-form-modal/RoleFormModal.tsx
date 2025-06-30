"use client";

import { useEffect, useMemo } from 'react';
import { useForm } from '@mantine/form';
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Button,
  Group,
  Text,
  Divider,
  LoadingOverlay,
  MultiSelect,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCreateRole, useUpdateRole, useRoleDetails } from '../../../../../hooks/useRoles';
import { usePermissions } from '../../../../../hooks/usePermissions';
import type { ICreateRoleRequest, IUpdateRoleRequest } from '../../../../../types/requests/admin/roles.types';

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

export function RoleFormModal({ opened, onClose, roleId, mode }: IRoleFormModalProps) {
  // Hooks
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const { data: roleDetails, isLoading: isLoadingRole } = useRoleDetails(roleId || 0);
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissions();

  // Form
  const form = useForm<IRoleFormValues>({
    initialValues: {
      name: '',
      description: '',
      permission_ids: [],
    },
    validate: {
      name: (value) => (!value ? 'Role name is required' : null),
    },
    transformValues: (values) => ({
      ...values,
      permission_ids: values.permission_ids || [],
    }),
  });

  // Load role data for editing
  useEffect(() => {
    if (mode === 'edit' && roleDetails) {
      form.setValues({
        name: roleDetails.name || '',
        description: roleDetails.description || '',
        permission_ids: roleDetails.permissions?.map((p: any) => p.id.toString()) || [],
      });
    }
  }, [mode, roleDetails]);

  // Reset form when modal closes
  useEffect(() => {
    if (!opened) {
      form.setValues({
        name: '',
        description: '',
        permission_ids: [],
      });
    }
  }, [opened]);

  // Prepare permission options - simplified without user permission validation
  const permissionOptions = useMemo(() => {
    // Early return with empty array if data is missing
    if (!permissionsData) {
      return [];
    }

    // Ensure permissions exists and is an array
    if (!permissionsData.permissions || !Array.isArray(permissionsData.permissions)) {
      return [];
    }
    
    // Simple mapping to Mantine v7 expected format
    return permissionsData.permissions
      .filter(permission => permission && typeof permission === 'object')
      .map(permission => ({
        value: permission.id?.toString() || '',
        label: permission.name || 'Unnamed Permission',
      }));
  }, [permissionsData]);

  // Handle form submission
  const handleSubmit = async (values: IRoleFormValues) => {
    try {
      const roleData = {
        name: values.name,
        description: values.description || undefined,
        permission_ids: (values.permission_ids || []).map(id => parseInt(id, 10)),
      };

      if (mode === 'create') {
        const createData: ICreateRoleRequest = {
          ...roleData,
        };
        await createRoleMutation.mutateAsync(createData);
        notifications.show({
          title: 'Success',
          message: 'Role created successfully',
          color: 'green',
        });
      } else if (roleId) {
        const updateData: IUpdateRoleRequest = {
          ...roleData,
        };
        await updateRoleMutation.mutateAsync({ roleId, data: updateData });
        notifications.show({
          title: 'Success',
          message: 'Role updated successfully',
          color: 'green',
        });
      }

      onClose();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || `Failed to ${mode} role`,
        color: 'red',
      });
    }
  };

  const isLoading = isLoadingRole || isLoadingPermissions;
  const isSubmitting = createRoleMutation.isPending || updateRoleMutation.isPending;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text size="lg" fw={600}>
          {mode === 'create' ? 'Create New Role' : 'Edit Role'}
        </Text>
      }
      size="xl"
      centered
    >
      <LoadingOverlay visible={isLoading} />
      
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <div>
            <Text size="sm" fw={500} mb="xs">
              Basic Information
            </Text>
            <Stack gap="sm">
              <TextInput
                label="Role Name"
                placeholder="Enter role name"
                required
                autoComplete="off"
                {...form.getInputProps('name')}
              />
              
              <Textarea
                label="Description"
                placeholder="Enter role description"
                autosize
                minRows={2}
                maxRows={4}
                {...form.getInputProps('description')}
              />
            </Stack>
          </div>

          <Divider />

          {/* Permissions */}
          <div>
            <Text size="sm" fw={500} mb="xs">
              Permissions
            </Text>
            
            {/* Render MultiSelect when permissionOptions is available */}
            {Array.isArray(permissionOptions) && permissionOptions.length > 0 ? (
              <MultiSelect
                label="Role Permissions"
                placeholder="Select permissions for this role"
                data={permissionOptions}
                searchable
                clearable
                maxDropdownHeight={300}
                disabled={isLoading}
                value={form.values.permission_ids || []}
                onChange={(value) => form.setFieldValue('permission_ids', value || [])}
              />
            ) : (
              <Text size="sm" c="dimmed">
                {isLoading ? 'Loading permissions...' : 'No permissions available'}
              </Text>
            )}
            
            <Text size="xs" c="dimmed" mt="xs">
              Select the permissions that users with this role should have.
            </Text>
          </div>

          {/* Actions */}
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {mode === 'create' ? 'Create Role' : 'Update Role'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
} 