"use client";

import { useState } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Button,
  Group,
  Text,
  Alert,
  LoadingOverlay,
} from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface IDeleteUserModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userEmail: string;
  isLoading?: boolean;
}

export function DeleteUserModal({
  opened,
  onClose,
  onConfirm,
  userEmail,
  isLoading = false,
}: IDeleteUserModalProps) {
  const [confirmEmail, setConfirmEmail] = useState('');

  const handleClose = () => {
    setConfirmEmail('');
    onClose();
  };

  const handleConfirm = () => {
    if (confirmEmail === userEmail) {
      onConfirm();
      setConfirmEmail('');
    }
  };

  const isValidEmail = confirmEmail === userEmail;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconAlertTriangle size={20} color="red" />
          <Text size="lg" fw={600} c="red">
            Delete User
          </Text>
        </Group>
      }
      centered
      size="md"
    >
      <LoadingOverlay visible={isLoading} />
      
      <Stack gap="md">
        <Alert color="red" variant="light">
          <Text size="sm">
            <strong>Warning:</strong> This action cannot be undone. All data related to this user will be permanently deleted.
          </Text>
        </Alert>

        <div>
          <Text size="sm" mb="xs">
            You are about to delete the user: <strong>{userEmail}</strong>
          </Text>
          <Text size="sm" c="dimmed">
            To confirm deletion, please type the user&apos;s email address below:
          </Text>
        </div>

        <TextInput
          label="Confirm Email"
          placeholder={userEmail}
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.currentTarget.value)}
          error={confirmEmail && !isValidEmail ? 'Email does not match' : null}
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={handleConfirm}
            disabled={!isValidEmail || isLoading}
            loading={isLoading}
          >
            Delete User
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
} 