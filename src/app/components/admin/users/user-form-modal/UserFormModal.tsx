"use client";

import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  Modal,
  Stack,
  TextInput,
  Select,
  Switch,
  Button,
  Group,
  MultiSelect,
  Text,
  Divider,
  LoadingOverlay,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCreateUser, useUpdateUser, useUserDetails } from '../../../../../hooks/useUsers';
import type { ICreateUserRequest, IUpdateUserRequest } from '../../../../../types/requests/admin/users.types';
import { useGroups } from '../../../../../hooks/useGroups';
import { useRoles } from '../../../../../hooks/useRoles';
import { useGenders } from '../../../../../hooks/useGenders';

interface IUserFormModalProps {
  opened: boolean;
  onClose: () => void;
  userId?: number | null;
  mode: 'create' | 'edit';
}

interface IUserFormValues {
  email: string;
  name: string;
  user_name: string;
  password?: string;
  confirmPassword?: string;
  id_genders: string | null;
  blocked: boolean;
  groupIds: string[];
  roleIds: string[];
}

export function UserFormModal({ opened, onClose, userId, mode }: IUserFormModalProps) {
  // Hooks
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const { data: userDetails, isLoading: isLoadingUser } = useUserDetails(userId || 0);
  const { data: groups, isLoading: isLoadingGroups } = useGroups();
  const { data: roles, isLoading: isLoadingRoles } = useRoles();
  const { data: genders, isLoading: isLoadingGenders } = useGenders();

  // Form
  const form = useForm<IUserFormValues>({
    initialValues: {
      email: '',
      name: '',
      user_name: '',
      password: '',
      confirmPassword: '',
      id_genders: null,
      blocked: false,
      groupIds: [],
      roleIds: [],
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/^\S+@\S+$/.test(value)) return 'Invalid email format';
        return null;
      },
      name: (value) => (!value ? 'Name is required' : null),
      user_name: (value) => (!value ? 'Username is required' : null),
      password: (value) => {
        if (mode === 'create' && !value) return 'Password is required';
        if (value && value.length < 8) return 'Password must be at least 8 characters';
        return null;
      },
      confirmPassword: (value, values) => {
        if (mode === 'create' && !value) return 'Please confirm password';
        if (value && value !== values.password) return 'Passwords do not match';
        return null;
      },
    },
  });

  // Load user data for editing
  useEffect(() => {
    if (mode === 'edit' && userDetails) {
      form.setValues({
        email: userDetails.email,
        name: userDetails.name || '',
        user_name: userDetails.user_name || '',
        password: '',
        confirmPassword: '',
        id_genders: userDetails.id_genders?.toString() || null,
        blocked: userDetails.blocked,
        groupIds: userDetails.groups.map((g: any) => g.id.toString()),
        roleIds: userDetails.roles.map((r: any) => r.id.toString()),
      });
    }
  }, [mode, userDetails]);

  // Reset form when modal closes
  useEffect(() => {
    if (!opened) {
      form.reset();
    }
  }, [opened]);

  // Handle form submission
  const handleSubmit = async (values: IUserFormValues) => {
    try {
      const userData = {
        email: values.email,
        name: values.name || undefined,
        user_name: values.user_name,
        id_genders: values.id_genders ? parseInt(values.id_genders, 10) : undefined,
        blocked: values.blocked,
        group_ids: values.groupIds.map(id => parseInt(id, 10)),
        role_ids: values.roleIds.map(id => parseInt(id, 10)),
      };

      if (mode === 'create') {
        const createData: ICreateUserRequest = {
          ...userData,
          password: values.password!,
        };
        await createUserMutation.mutateAsync(createData);
        notifications.show({
          title: 'Success',
          message: 'User created successfully',
          color: 'green',
        });
      } else if (userId) {
        const updateData: IUpdateUserRequest = {
          ...userData,
          ...(values.password && { password: values.password }),
        };
        await updateUserMutation.mutateAsync({ userId, userData: updateData });
        notifications.show({
          title: 'Success',
          message: 'User updated successfully',
          color: 'green',
        });
      }

      onClose();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || `Failed to ${mode} user`,
        color: 'red',
      });
    }
  };

  const isLoading = isLoadingUser || isLoadingGroups || isLoadingRoles || isLoadingGenders;
  const isSubmitting = createUserMutation.isPending || updateUserMutation.isPending;

  // Prepare select data
  const genderOptions = genders?.genders?.map((gender) => ({
    value: gender.id.toString(),
    label: gender.name,
  })) || [];

  const groupOptions = groups?.groups?.map((group) => ({
    value: group.id.toString(),
    label: group.name,
    description: group.description,
  })) || [];

  const roleOptions = roles?.roles?.map((role) => ({
    value: role.id.toString(),
    label: role.name,
    description: role.description,
  })) || [];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text size="lg" fw={600}>
          {mode === 'create' ? 'Create New User' : 'Edit User'}
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
                label="Email"
                placeholder="user@example.com"
                required
                {...form.getInputProps('email')}
              />
              
              <Group grow>
                <TextInput
                  label="Full Name"
                  placeholder="John Doe"
                  required
                  {...form.getInputProps('name')}
                />
                <TextInput
                  label="Username"
                  placeholder="johndoe"
                  required
                  {...form.getInputProps('user_name')}
                />
              </Group>

              <Select
                label="Gender"
                placeholder="Select gender"
                data={genderOptions}
                {...form.getInputProps('id_genders')}
              />
            </Stack>
          </div>

          <Divider />

          {/* Password Section */}
          <div>
            <Text size="sm" fw={500} mb="xs">
              {mode === 'create' ? 'Password' : 'Change Password (Optional)'}
            </Text>
            <Stack gap="sm">
              <TextInput
                label="Password"
                type="password"
                placeholder="Enter password"
                required={mode === 'create'}
                {...form.getInputProps('password')}
              />
              <TextInput
                label="Confirm Password"
                type="password"
                placeholder="Confirm password"
                required={mode === 'create'}
                {...form.getInputProps('confirmPassword')}
              />
            </Stack>
          </div>

          <Divider />

          {/* Groups and Roles */}
          <div>
            <Text size="sm" fw={500} mb="xs">
              Groups and Roles
            </Text>
            <Stack gap="sm">
              <MultiSelect
                label="User Groups"
                placeholder="Select groups"
                data={groupOptions}
                searchable
                clearable
                {...form.getInputProps('groupIds')}
              />
              
              <MultiSelect
                label="User Roles"
                placeholder="Select roles"
                data={roleOptions}
                searchable
                clearable
                {...form.getInputProps('roleIds')}
              />
            </Stack>
          </div>

          <Divider />

          {/* Status */}
          <div>
            <Text size="sm" fw={500} mb="xs">
              Status
            </Text>
            <Switch
              label="Block User"
              description="Blocked users cannot log in to the system"
              {...form.getInputProps('blocked', { type: 'checkbox' })}
            />
          </div>

          {/* Actions */}
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {mode === 'create' ? 'Create User' : 'Update User'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
} 