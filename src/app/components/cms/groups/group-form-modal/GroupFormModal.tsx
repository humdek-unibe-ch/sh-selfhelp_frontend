"use client";

import { useEffect, useState } from 'react';
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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCreateGroup, useUpdateGroup, useGroupDetails } from '../../../../../hooks/useGroups';
import { AclManagement, type IAclPage } from '../advanced-acl-modal/AdvancedAclModal';
import type { ICreateGroupRequest, IUpdateGroupRequest } from '../../../../../types/requests/admin/groups.types';
import { validateName } from '../../../../../utils/name-validation.utils';
import { convertAclsToApiFormat, convertApiAclsToUiFormat } from '../../../../../utils/acl-conversion.utils';

interface IGroupFormModalProps {
  opened: boolean;
  onClose: () => void;
  groupId?: number | null;
  mode: 'create' | 'edit';
  onAdvancedAcls?: (groupId: number, groupName: string) => void;
}

interface IGroupFormValues {
  name: string;
  description: string;
  requires_2fa: boolean;
}

export function GroupFormModal({ opened, onClose, groupId, mode, onAdvancedAcls }: IGroupFormModalProps) {
  // Hooks
  const createGroupMutation = useCreateGroup();
  const updateGroupMutation = useUpdateGroup();
  const { data: groupDetails, isLoading: isLoadingGroup } = useGroupDetails(groupId || 0);
  
  // State for ACL management
  const [selectedPages, setSelectedPages] = useState<IAclPage[]>([]);

  // Form
  const form = useForm<IGroupFormValues>({
    initialValues: {
      name: '',
      description: '',
      requires_2fa: false,
    },
    validate: {
      name: (value) => {
        if (mode === 'edit') return null; // Skip validation in edit mode
        if (!value) return 'Group name is required';
        const validation = validateName(value);
        return validation.isValid ? null : validation.error;
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
      });

      // Load ACL data if available
      if (groupDetails.acls && Array.isArray(groupDetails.acls)) {
        const aclPages = convertApiAclsToUiFormat(groupDetails.acls);
        setSelectedPages(aclPages);
      }
    }
  }, [mode, groupDetails]);

  // Reset form when modal closes
  useEffect(() => {
    if (!opened) {
      form.reset();
      setSelectedPages([]);
    }
  }, [opened]);



  // Handle form submission
  const handleSubmit = async (values: IGroupFormValues) => {
    try {
      const groupData = {
        name: values.name,
        description: values.description || undefined,
        requires_2fa: values.requires_2fa,
        acls: convertAclsToApiFormat(selectedPages),
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

  const isLoading = isLoadingGroup;
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

          {/* ACL Management */}
          <div>
            <Text size="sm" fw={500} mb="xs">
              Access Control Lists (ACLs)
            </Text>
            
            <AclManagement
              selectedPages={selectedPages}
              onChange={setSelectedPages}
              showHeader={true}
              maxHeight={400}
              initiallyExpanded={false}
            />
            
            <Text size="xs" c="dimmed" mt="xs">
              Configure page-based access control for this group. Members will inherit these permissions.
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