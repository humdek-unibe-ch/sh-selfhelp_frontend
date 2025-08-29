"use client";

import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
    Stack,
    TextInput,
    Select,
    Switch,
    Group,
    MultiSelect,
    Text,
    Divider,
    LoadingOverlay,
} from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateUser, useUpdateUser, useUserDetails } from '../../../../../hooks/useUsers';
import { showErrorNotification, showSuccessNotification } from '../../../../../utils/mutation-error-handler';
import type { ICreateUserRequest, IUpdateUserRequest } from '../../../../../types/requests/admin/users.types';
import { useGroups } from '../../../../../hooks/useGroups';
import { useRoles } from '../../../../../hooks/useRoles';
import { useGenders } from '../../../../../hooks/useGenders';
import { validateName, validateValidationCode } from '../../../../../utils/name-validation.utils';
import { ModalWrapper } from '../../../shared';

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
    validation_code: string;
    id_genders: string | null;
    blocked: boolean;
    groupIds: string[];
    roleIds: string[];
}

export function UserFormModal({ opened, onClose, userId, mode }: IUserFormModalProps) {
    // Hooks
    const queryClient = useQueryClient();
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
            validation_code: '',
            id_genders: null,
            blocked: false,
            groupIds: [],
            roleIds: [],
        },
        validate: {
            email: (value) => {
                if (mode === 'edit') return null; // Skip validation in edit mode
                if (!value) return 'Email is required';
                if (!/^\S+@\S+$/.test(value)) return 'Invalid email format';
                return null;
            },
            name: (value) => (!value ? 'Name is required' : null),
            user_name: (value) => {
                if (mode === 'edit') return null; // Skip validation in edit mode
                if (!value) return 'Username is required';
                const validation = validateName(value);
                return validation.isValid ? null : validation.error;
            },
            validation_code: (value) => {
                if (mode === 'create' && !value) return 'Validation code is required';
                if (value) {
                    const validation = validateValidationCode(value);
                    return validation.isValid ? null : validation.error;
                }
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
                validation_code: userDetails.validation_code || '',
                id_genders: userDetails.id_genders?.toString() || null,
                blocked: userDetails.blocked,
                groupIds: userDetails.groups?.map((g: any) => g.id.toString()) || [],
                roleIds: userDetails.roles?.map((r: any) => r.id.toString()) || [],
            });
        }
    }, [mode, userDetails]);

    // Reset form when modal closes and invalidate user query on edit
    useEffect(() => {
        if (!opened) {
            form.reset();
        } else if (mode === 'edit' && userId) {
            // Invalidate user details query to ensure fresh data
            queryClient.invalidateQueries({ queryKey: ['adminUserDetails', userId] });
        }
    }, [opened, mode, userId, queryClient]);

    // Handle form submission
    const handleSubmit = async (values: IUserFormValues) => {
        try {
            if (mode === 'create') {
                const createData: ICreateUserRequest = {
                    email: values.email,
                    name: values.name || undefined,
                    user_name: values.user_name,
                    validation_code: values.validation_code,
                    id_genders: values.id_genders ? parseInt(values.id_genders, 10) : undefined,
                    blocked: values.blocked,
                    group_ids: values.groupIds.map(id => parseInt(id, 10)),
                    role_ids: values.roleIds.map(id => parseInt(id, 10)),
                };
                await createUserMutation.mutateAsync(createData);
                showSuccessNotification(
                    'User Created',
                    'User created successfully'
                );
            } else if (userId) {
                const updateData: IUpdateUserRequest = {
                    name: values.name || undefined,
                    id_genders: values.id_genders ? parseInt(values.id_genders, 10) : undefined,
                    blocked: values.blocked,
                    group_ids: values.groupIds.map(id => parseInt(id, 10)),
                    role_ids: values.roleIds.map(id => parseInt(id, 10)),
                };
                await updateUserMutation.mutateAsync({ userId, userData: updateData });
                showSuccessNotification(
                    'User Updated',
                    'User updated successfully'
                );
            }

            onClose();
        } catch (error: any) {
            showErrorNotification(
                error,
                'Operation Failed',
                `Failed to ${mode} user`
            );
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
    })) || [];

    const roleOptions = roles?.roles?.map((role) => ({
        value: role.id.toString(),
        label: role.name,
    })) || [];

    const handleSave = () => {
        form.onSubmit(handleSubmit)();
    };

    return (
        <ModalWrapper
            opened={opened}
            onClose={onClose}
            title={mode === 'create' ? 'Create New User' : 'Edit User'}
            size="xl"
            onSave={handleSave}
            onCancel={onClose}
            isLoading={isSubmitting}
            saveLabel={mode === 'create' ? 'Create User' : 'Update User'}
            cancelLabel="Cancel"
            scrollAreaHeight={500}
        >
            <LoadingOverlay visible={isLoading} />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    {/* User Information Display for Edit Mode */}
                    {mode === 'edit' && userDetails && (
                        <div>
                            <Text size="sm" fw={500} mb="xs">
                                User Information
                            </Text>
                            <Stack gap="xs">
                                <Group>
                                    <Text size="sm" fw={500} c="dimmed" style={{ minWidth: '80px' }}>
                                        Email:
                                    </Text>
                                    <Text size="sm">
                                        {userDetails.email}
                                    </Text>
                                </Group>
                                <Group>
                                    <Text size="sm" fw={500} c="dimmed" style={{ minWidth: '80px' }}>
                                        Username:
                                    </Text>
                                    <Text size="sm">
                                        {userDetails.user_name || '-'}
                                    </Text>
                                </Group>
                            </Stack>
                        </div>
                    )}

                    {/* Basic Information */}
                    <div>
                        <Text size="sm" fw={500} mb="xs">
                            {mode === 'create' ? 'Basic Information' : 'Editable Information'}
                        </Text>
                        <Stack gap="sm">
                            {mode === 'create' && (
                                <>
                                    <TextInput
                                        label="Email"
                                        placeholder="user@example.com"
                                        required
                                        autoComplete="off"
                                        {...form.getInputProps('email')}
                                    />

                                    <Group grow>
                                        <TextInput
                                            label="Full Name"
                                            placeholder="John Doe"
                                            required
                                            autoComplete="off"
                                            {...form.getInputProps('name')}
                                        />
                                        <TextInput
                                            label="Username"
                                            placeholder="johndoe"
                                            required
                                            autoComplete="off"
                                            description="Only letters, numbers, hyphens, and underscores allowed"
                                            {...form.getInputProps('user_name')}
                                        />
                                    </Group>

                                    <TextInput
                                        label="Validation Code"
                                        placeholder="Enter validation code"
                                        required
                                        autoComplete="off"
                                        description="Max 16 characters. Only letters, numbers, hyphens, and underscores allowed"
                                        {...form.getInputProps('validation_code')}
                                    />
                                </>
                            )}

                            {mode === 'edit' && (
                                <TextInput
                                    label="Full Name"
                                    placeholder="John Doe"
                                    required
                                    autoComplete="off"
                                    {...form.getInputProps('name')}
                                />
                            )}

                            <Select
                                label="Gender"
                                placeholder="Select gender"
                                data={genderOptions}
                                {...form.getInputProps('id_genders')}
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

                </Stack>
            </form>
        </ModalWrapper>
    );
} 