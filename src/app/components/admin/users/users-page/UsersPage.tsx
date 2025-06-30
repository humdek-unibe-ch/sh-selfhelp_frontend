"use client";

import { useState } from 'react';
import { UsersList } from '../users-list/UsersList';
import { UserFormModal } from '../user-form-modal/UserFormModal';
import { DeleteUserModal } from '../delete-user-modal/DeleteUserModal';
import { 
  useDeleteUser, 
  useToggleUserBlock, 
  useSendActivationMail, 
  useImpersonateUser 
} from '../../../../../hooks/useUsers';
import { notifications } from '@mantine/notifications';

export function UsersPage() {
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
      <UsersList
        onCreateUser={handleCreateUser}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onToggleBlock={handleToggleBlock}
        onSendActivationMail={handleSendActivationMail}
        onImpersonateUser={handleImpersonateUser}
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