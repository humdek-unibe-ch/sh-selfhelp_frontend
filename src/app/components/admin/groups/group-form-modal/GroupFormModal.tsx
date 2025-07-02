"use client";

import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Switch,
  Button,
  Group,
  Text,
  Divider,
  LoadingOverlay,
  MultiSelect,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCreateGroup, useUpdateGroup, useGroupDetails } from '../../../../../hooks/useGroups';
import { usePermissions } from '../../../../../hooks/usePermissions';
import type { ICreateGroupRequest, IUpdateGroupRequest } from '../../../../../types/requests/admin/groups.types';

interface IGroupFormModalProps {
  opened: boolean;
  onClose: () => void;
  groupId?: number | null;
  mode: 'create' | 'edit';
}

interface IGroupFormValues {
  name: string;
  description: string;
  requires_2fa: boolean;
  acls: string[];
}

export function GroupFormModal({ opened, onClose, groupId, mode }: IGroupFormModalProps) {
  // Hooks
  const createGroupMutation = useCreateGroup();
  const updateGroupMutation = useUpdateGroup();
  const { data: groupDetails, isLoading: isLoadingGroup } = useGroupDetails(groupId || 0);
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissions();

  // Form
  const form = useForm<IGroupFormValues>({
    initialValues: {
      name: '',
      description: '',
      requires_2fa: false,
      acls: [],
    },
    validate: {
      name: (value) => {
        if (mode === 'edit') return null; // Skip validation in edit mode
        return !value ? 'Group name is required' : null;
      },
    },
  });

  // Load group data for editing
  useEffect(() => {
    if (mode === 'edit' && groupDetails) {
      form.setValues({
        name: groupDetails.name || '',
        description: groupDetails.description || '',
        requires_2fa: groupDetails.requires_2fa || false,
        acls: groupDetails.acls?.map((acl: any) => acl.id.toString()) || [],
      });
    }
  }, [mode, groupDetails]);

  // Reset form when modal closes
  useEffect(() => {
    if (!opened) {
      form.reset();
    }
  }, [opened]);

  // Prepare ACL options - simplified without user permission validation
  const aclOptions = permissionsData?.permissions?.map((permission: any) => ({
    value: permission.id.toString(),
    label: permission.name,
    description: permission.description,
  })) || [];

  // Handle form submission
  const handleSubmit = async (values: IGroupFormValues) => {
    try {
      const groupData = {
        name: values.name,
        description: values.description || undefined,
        requires_2fa: values.requires_2fa,
        acls: values.acls.map(id => parseInt(id, 10)),
      };

      if (mode === 'create') {
        const createData: ICreateGroupRequest = {
          ...groupData,
        };
        await createGroupMutation.mutateAsync(createData);
        notifications.show({
          title: 'Success',
          message: 'Group created successfully',
          color: 'green',
        });
      } else if (groupId) {
        const updateData: IUpdateGroupRequest = {
          ...groupData,
        };
        await updateGroupMutation.mutateAsync({ groupId, data: updateData });
        notifications.show({
          title: 'Success',
          message: 'Group updated successfully',
          color: 'green',
        });
      }

      onClose();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || `Failed to ${mode} group`,
        color: 'red',
      });
    }
  };

  const isLoading = isLoadingGroup || isLoadingPermissions;
  const isSubmitting = createGroupMutation.isPending || updateGroupMutation.isPending;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text size="lg" fw={600}>
          {mode === 'create' ? 'Create New Group' : 'Edit Group'}
        </Text>
      }
      size="xl"
      centered
    >
      <LoadingOverlay visible={isLoading} />
      
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Group Information Display for Edit Mode */}
          {mode === 'edit' && groupDetails && (
            <div>
              <Text size="sm" fw={500} mb="xs">
                Group Information
              </Text>
              <Group>
                <Text size="sm" fw={500} c="dimmed" style={{ minWidth: '80px' }}>
                  Name:
                </Text>
                <Text size="sm">
                  {groupDetails.name}
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
                  label="Group Name"
                  placeholder="Enter group name"
                  required
                  autoComplete="off"
                  {...form.getInputProps('name')}
                />
              )}
              
              <Textarea
                label="Description"
                placeholder="Enter group description"
                autosize
                minRows={2}
                maxRows={4}
                {...form.getInputProps('description')}
              />
            </Stack>
          </div>

          <Divider />

          {/* Settings */}
          <div>
            <Text size="sm" fw={500} mb="xs">
              Security Settings
            </Text>
            <Switch
              label="Require Two-Factor Authentication"
              description="Members of this group must have 2FA enabled"
              {...form.getInputProps('requires_2fa', { type: 'checkbox' })}
            />
          </div>

          <Divider />

          {/* ACLs */}
          <div>
            <Text size="sm" fw={500} mb="xs">
              Access Control Lists (ACLs)
            </Text>
            
            <MultiSelect
              label="Group ACLs"
              placeholder="Select ACLs for this group"
              data={aclOptions}
              searchable
              clearable
              maxDropdownHeight={300}
              disabled={isLoading}
              {...form.getInputProps('acls')}
            />
            
            <Text size="xs" c="dimmed" mt="xs">
              Select the ACLs that members of this group should have.
            </Text>
          </div>

          {/* Actions */}
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {mode === 'create' ? 'Create Group' : 'Update Group'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
} 