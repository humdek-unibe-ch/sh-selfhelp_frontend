"use client";

import { useEffect, useMemo } from 'react';
import { useForm } from '@mantine/form';
import {
  Stack,
  TextInput,
  Textarea,
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
import { ModalWrapper } from '../../../shared';

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

  // Prepare permission options
  const permissionOptions = useMemo(() => {
    if (!permissionsData?.permissions || !Array.isArray(permissionsData.permissions)) {
      return [];
    }
    
    return permissionsData.permissions.map((permission: any) => ({
      value: permission.id.toString(),
      label: permission.name,
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

  const handleSave = () => {
    form.onSubmit(handleSubmit)();
  };

  return (
    <ModalWrapper
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? 'Create New Role' : 'Edit Role'}
      size="xl"
      onSave={handleSave}
      onCancel={onClose}
      isLoading={isSubmitting}
      saveLabel={mode === 'create' ? 'Create Role' : 'Update Role'}
      cancelLabel="Cancel"
      scrollAreaHeight={500}
    >
      <LoadingOverlay visible={isLoading} />
      
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Role Information Display for Edit Mode */}
          {mode === 'edit' && roleDetails && (
            <div>
              <Text size="sm" fw={500} mb="xs">
                Role Information
              </Text>
              <Group>
                <Text size="sm" fw={500} c="dimmed" className="min-w-[80px]">
                  Name:
                </Text>
                <Text size="sm">
                  {roleDetails.name}
                </Text>
              </Group>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <Text size="sm" fw={500} mb="xs">
              {mode === 'create' ? 'Basic Information' : 'Editable Information'}
            </Text>
            <Stack gap="sm">
              {mode === 'create' && (
                <TextInput
                  label="Role Name"
                  placeholder="Enter role name"
                  required
                  autoComplete="off"
                  {...form.getInputProps('name')}
                />
              )}
              
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
            
            <MultiSelect
              label="Role Permissions"
              placeholder="Select permissions for this role"
              data={permissionOptions}
              searchable
              clearable
              maxDropdownHeight={300}
              disabled={isLoading}
              {...form.getInputProps('permission_ids')}
            />
            
            <Text size="xs" c="dimmed" mt="xs">
              Select the permissions that users with this role should have.
            </Text>
          </div>

        </Stack>
      </form>
    </ModalWrapper>
  );
} 