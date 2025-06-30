"use client";

import { useState } from 'react';
import { Modal, Button, Text, Group, Stack } from '@mantine/core';
import { UsersList } from '../users-list/UsersList';
import { 
  useDeleteUser, 
  useToggleUserBlock, 
  useSendActivationMail, 
  useImpersonateUser 
} from '../../../../../hooks/useUsers';

interface IConfirmationModal {
  type: 'delete' | 'block' | 'unblock' | 'activation' | 'impersonate' | null;
  userId: number | null;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
}

export function UsersPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<IConfirmationModal>({
    type: null,
    userId: null,
    title: '',
    message: '',
    confirmLabel: '',
  });

  // Mutations
  const deleteUserMutation = useDeleteUser();
  const toggleBlockMutation = useToggleUserBlock();
  const sendActivationMailMutation = useSendActivationMail();
  const impersonateUserMutation = useImpersonateUser();

  // Handle create user
  const handleCreateUser = () => {
    setCreateModalOpen(true);
  };

  // Handle edit user
  const handleEditUser = (userId: number) => {
    setEditUserId(userId);
  };

  // Handle delete user with confirmation
  const handleDeleteUser = (userId: number) => {
    setConfirmationModal({
      type: 'delete',
      userId,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      confirmLabel: 'Delete',
      confirmColor: 'red',
    });
  };

  // Handle toggle user block
  const handleToggleBlock = (userId: number, blocked: boolean) => {
    const action = blocked ? 'block' : 'unblock';
    setConfirmationModal({
      type: blocked ? 'block' : 'unblock',
      userId,
      title: `${blocked ? 'Block' : 'Unblock'} User`,
      message: `Are you sure you want to ${action} this user?`,
      confirmLabel: blocked ? 'Block' : 'Unblock',
      confirmColor: blocked ? 'red' : 'green',
    });
  };

  // Handle send activation mail
  const handleSendActivationMail = (userId: number) => {
    setConfirmationModal({
      type: 'activation',
      userId,
      title: 'Send Activation Mail',
      message: 'Send activation mail to this user?',
      confirmLabel: 'Send',
    });
  };

  // Handle impersonate user
  const handleImpersonateUser = (userId: number) => {
    setConfirmationModal({
      type: 'impersonate',
      userId,
      title: 'Impersonate User',
      message: 'You will be logged in as this user. Continue?',
      confirmLabel: 'Impersonate',
      confirmColor: 'orange',
    });
  };

  // Handle confirmation modal confirm
  const handleConfirm = () => {
    if (!confirmationModal.userId || !confirmationModal.type) return;

    switch (confirmationModal.type) {
      case 'delete':
        deleteUserMutation.mutate(confirmationModal.userId);
        break;
      case 'block':
        toggleBlockMutation.mutate({ 
          userId: confirmationModal.userId, 
          data: { blocked: true } 
        });
        break;
      case 'unblock':
        toggleBlockMutation.mutate({ 
          userId: confirmationModal.userId, 
          data: { blocked: false } 
        });
        break;
      case 'activation':
        sendActivationMailMutation.mutate(confirmationModal.userId);
        break;
      case 'impersonate':
        impersonateUserMutation.mutate(confirmationModal.userId);
        break;
    }

    setConfirmationModal({
      type: null,
      userId: null,
      title: '',
      message: '',
      confirmLabel: '',
    });
  };

  // Handle confirmation modal cancel
  const handleCancel = () => {
    setConfirmationModal({
      type: null,
      userId: null,
      title: '',
      message: '',
      confirmLabel: '',
    });
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

      {/* Confirmation Modal */}
      <Modal
        opened={!!confirmationModal.type}
        onClose={handleCancel}
        title={confirmationModal.title}
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            {confirmationModal.message}
          </Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              color={confirmationModal.confirmColor}
              onClick={handleConfirm}
              loading={
                deleteUserMutation.isPending ||
                toggleBlockMutation.isPending ||
                sendActivationMailMutation.isPending ||
                impersonateUserMutation.isPending
              }
            >
              {confirmationModal.confirmLabel}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Create User Modal - Placeholder for now */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New User"
        size="lg"
      >
        <Stack gap="md">
          <Text>Create user form will be implemented here</Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setCreateModalOpen(false)}>
              Create User
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit User Modal - Placeholder for now */}
      <Modal
        opened={!!editUserId}
        onClose={() => setEditUserId(null)}
        title="Edit User"
        size="lg"
      >
        <Stack gap="md">
          <Text>Edit user form will be implemented here (User ID: {editUserId})</Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setEditUserId(null)}>
              Cancel
            </Button>
            <Button onClick={() => setEditUserId(null)}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
} 