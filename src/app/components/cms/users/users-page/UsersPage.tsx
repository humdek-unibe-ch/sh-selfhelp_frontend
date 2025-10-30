"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UsersList } from '../users-list/UsersList';
import { UserFormModal } from '../user-form-modal/UserFormModal';
import { DeleteUserModal } from '../delete-user-modal/DeleteUserModal';
import {
  useDeleteUser,
  useToggleUserBlock,
  useSendActivationMail,
  useImpersonateUser
} from '../../../../../hooks/useUsers';
import { useAuth } from '../../../../../hooks/useAuth';
import { ROUTES } from '../../../../../config/routes.config';
import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';
import { notifications } from '@mantine/notifications';
import { Alert, Box, Badge, Group, Text } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';

export function UsersPage() {
  const { hasPermission, isLoading } = useAuth();
  const router = useRouter();

  const [userFormModal, setUserFormModal] = useState<{
    opened: boolean;
    mode: 'create' | 'edit';
    userId?: number;
  }>({
    opened: false,
    mode: 'create',
    userId: undefined,
  });

  const [deleteModal, setDeleteModal] = useState<{
    opened: boolean;
    userId?: number;
    userEmail?: string;
  }>({
    opened: false,
    userId: undefined,
    userEmail: undefined,
  });

  // Check permissions
  const canReadUsers = hasPermission(PERMISSIONS.ADMIN_USER_READ);
  const canCreateUsers = hasPermission(PERMISSIONS.ADMIN_USER_CREATE);
  const canUpdateUsers = hasPermission(PERMISSIONS.ADMIN_USER_UPDATE);
  const canDeleteUsers = hasPermission(PERMISSIONS.ADMIN_USER_DELETE);
  const canBlockUsers = hasPermission(PERMISSIONS.ADMIN_USER_BLOCK);
  const canUnblockUsers = hasPermission(PERMISSIONS.ADMIN_USER_UNBLOCK);
  const canImpersonateUsers = hasPermission(PERMISSIONS.ADMIN_USER_IMPERSONATE);

  // Redirect if no read permission
  useEffect(() => {
    if (!isLoading && !canReadUsers) {
      router.push(ROUTES.NO_ACCESS);
    }
  }, [canReadUsers, isLoading, router]);

  // Show loading while checking permissions
  if (isLoading) {
    return null;
  }

  // Show access denied if no read permission
  if (!canReadUsers) {
    return (
      <Box>
        <Alert
          variant="light"
          color="red"
          title="Access Denied"
          icon={<IconAlertCircle />}
        >
          You don't have permission to view users. Required permission: {PERMISSIONS.ADMIN_USER_READ}
        </Alert>
      </Box>
    );
  }

  // Mutations
  const deleteUserMutation = useDeleteUser();
  const toggleBlockMutation = useToggleUserBlock();
  const sendActivationMailMutation = useSendActivationMail();
  const impersonateUserMutation = useImpersonateUser();

  // Handle create user
  const handleCreateUser = () => {
    setUserFormModal({
      opened: true,
      mode: 'create',
      userId: undefined,
    });
  };

  // Handle edit user
  const handleEditUser = (userId: number) => {
    setUserFormModal({
      opened: true,
      mode: 'edit',
      userId,
    });
  };

  // Handle delete user
  const handleDeleteUser = (userId: number, email: string) => {
    setDeleteModal({
      opened: true,
      userId,
      userEmail: email,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.userId) {
      deleteUserMutation.mutate(deleteModal.userId, {
        onSuccess: () => {
          setDeleteModal({ opened: false, userId: undefined, userEmail: undefined });
        },
      });
    }
  };

  // Handle toggle user block
  const handleToggleBlock = (userId: number, blocked: boolean) => {
    toggleBlockMutation.mutate({ 
      userId, 
      data: { blocked } 
    });
  };

  // Handle send activation mail
  const handleSendActivationMail = (userId: number) => {
    sendActivationMailMutation.mutate(userId);
  };

  // Handle impersonate user
  const handleImpersonateUser = (userId: number) => {
    impersonateUserMutation.mutate(userId);
  };

  return (
    <>
      {/* Debug: Show user permissions (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <Box mb="md" p="sm" style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
          <Text size="sm" fw={600} mb="xs">User Permissions (Debug):</Text>
          <Group gap="xs" mb="xs">
            <Badge color={canReadUsers ? 'green' : 'red'} leftSection={canReadUsers ? <IconCheck size={12} /> : <IconX size={12} />}>
              Read Users
            </Badge>
            <Badge color={canCreateUsers ? 'green' : 'red'} leftSection={canCreateUsers ? <IconCheck size={12} /> : <IconX size={12} />}>
              Create Users
            </Badge>
            <Badge color={canUpdateUsers ? 'green' : 'red'} leftSection={canUpdateUsers ? <IconCheck size={12} /> : <IconX size={12} />}>
              Update Users
            </Badge>
            <Badge color={canDeleteUsers ? 'green' : 'red'} leftSection={canDeleteUsers ? <IconCheck size={12} /> : <IconX size={12} />}>
              Delete Users
            </Badge>
            <Badge color={canBlockUsers ? 'green' : 'red'} leftSection={canBlockUsers ? <IconCheck size={12} /> : <IconX size={12} />}>
              Block Users
            </Badge>
            <Badge color={canUnblockUsers ? 'green' : 'red'} leftSection={canUnblockUsers ? <IconCheck size={12} /> : <IconX size={12} />}>
              Unblock Users
            </Badge>
            <Badge color={canImpersonateUsers ? 'green' : 'red'} leftSection={canImpersonateUsers ? <IconCheck size={12} /> : <IconX size={12} />}>
              Impersonate Users
            </Badge>
          </Group>
        </Box>
      )}

      <UsersList
        onCreateUser={canCreateUsers ? handleCreateUser : undefined}
        onEditUser={canUpdateUsers ? handleEditUser : undefined}
        onDeleteUser={canDeleteUsers ? handleDeleteUser : undefined}
        onToggleBlock={(canBlockUsers || canUnblockUsers) ? handleToggleBlock : undefined}
        onSendActivationMail={canUpdateUsers ? handleSendActivationMail : undefined}
        onImpersonateUser={canImpersonateUsers ? handleImpersonateUser : undefined}
        permissions={{
          canCreate: canCreateUsers,
          canUpdate: canUpdateUsers,
          canDelete: canDeleteUsers,
          canBlock: canBlockUsers,
          canUnblock: canUnblockUsers,
          canImpersonate: canImpersonateUsers,
        }}
      />
      
      <UserFormModal
        opened={userFormModal.opened}
        onClose={() => setUserFormModal({ opened: false, mode: 'create', userId: undefined })}
        mode={userFormModal.mode}
        userId={userFormModal.userId}
      />

      <DeleteUserModal
        opened={deleteModal.opened}
        onClose={() => setDeleteModal({ opened: false, userId: undefined, userEmail: undefined })}
        onConfirm={handleConfirmDelete}
        userEmail={deleteModal.userEmail || ''}
        isLoading={deleteUserMutation.isPending}
      />
    </>
  );
} 