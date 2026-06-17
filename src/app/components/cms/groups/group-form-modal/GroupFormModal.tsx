/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import {
  Stack,
  TextInput,
  Textarea,
  Switch,
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
import { ModalWrapper } from '../../../shared';

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

export function GroupFormModal({ opened, onClose, groupId, mode }: IGroupFormModalProps) {
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

  // Load group data for editing. `form.setValues` is a side effect, so it stays
  // in an effect; the `selectedPages` sync is handled render-phase below.
  useEffect(() => {
    if (mode === 'edit' && groupDetails) {
      form.setValues({
        name: groupDetails.name || '',
        description: groupDetails.description || '',
        requires_2fa: groupDetails.requires_2fa || false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional init-on-edit; `form` is a fresh object each render, so depending on it would re-run every render and clobber edits. `form.setValues` is stable.
  }, [mode, groupDetails]);

  // Reset form when modal closes. `form.reset` is a side effect, so it stays in
  // an effect; the `selectedPages` reset is handled render-phase below.
  useEffect(() => {
    if (!opened) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional reset-on-close; `form` is a fresh object each render, so depending on it would re-run every render. `form.reset` is stable.
  }, [opened]);

  // Keep `selectedPages` in sync with edit data / close transitions without a
  // set-state-in-effect, tracking the previous inputs (matching the effects'
  // [mode, groupDetails] and [opened] dependencies).
  const [prevMode, setPrevMode] = useState(mode);
  const [prevGroupDetails, setPrevGroupDetails] = useState(groupDetails);
  const [prevOpened, setPrevOpened] = useState(opened);
  if (prevMode !== mode || prevGroupDetails !== groupDetails) {
    setPrevMode(mode);
    setPrevGroupDetails(groupDetails);
    if (mode === 'edit' && groupDetails && groupDetails.acls && Array.isArray(groupDetails.acls)) {
      setSelectedPages(convertApiAclsToUiFormat(groupDetails.acls));
    }
  }
  if (prevOpened !== opened) {
    setPrevOpened(opened);
    if (!opened) {
      setSelectedPages([]);
    }
  }



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
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notifications.show({
        title: 'Error',
        message: message || `Failed to ${mode} group`,
        color: 'red',
      });
    }
  };

  const isLoading = isLoadingGroup;
  const isSubmitting = createGroupMutation.isPending || updateGroupMutation.isPending;

  const handleSave = () => {
    form.onSubmit(handleSubmit)();
  };

  return (
    <ModalWrapper
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? 'Create New Group' : 'Edit Group'}
      size="xl"
      onSave={handleSave}
      onCancel={onClose}
      isLoading={isSubmitting}
      saveLabel={mode === 'create' ? 'Create Group' : 'Update Group'}
      cancelLabel="Cancel"
      scrollAreaHeight={500}
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
                <Text size="sm" fw={500} c="dimmed" className="min-w-[80px]">
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

        </Stack>
      </form>
    </ModalWrapper>
  );
} 