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

interface IDeleteRoleModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  roleName: string;
  isLoading?: boolean;
}

export function DeleteRoleModal({
  opened,
  onClose,
  onConfirm,
  roleName,
  isLoading = false,
}: IDeleteRoleModalProps) {
  const [confirmName, setConfirmName] = useState('');

  const handleClose = () => {
    setConfirmName('');
    onClose();
  };

  const handleConfirm = () => {
    if (confirmName === roleName) {
      onConfirm();
      setConfirmName('');
    }
  };

  const isValidName = confirmName === roleName;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconAlertTriangle size={20} color="red" />
          <Text size="lg" fw={600} c="red">
            Delete Role
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
            <strong>Warning:</strong> This action cannot be undone. All data related to this role will be permanently deleted.
          </Text>
        </Alert>

        <div>
          <Text size="sm" mb="xs">
            You are about to delete the role: <strong>{roleName}</strong>
          </Text>
          <Text size="sm" c="dimmed">
            To confirm deletion, please type the role name below:
          </Text>
        </div>

        <TextInput
          label="Confirm Role Name"
          placeholder={roleName}
          value={confirmName}
          onChange={(e) => setConfirmName(e.currentTarget.value)}
          error={confirmName && !isValidName ? 'Role name does not match' : null}
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={handleConfirm}
            disabled={!isValidName || isLoading}
            loading={isLoading}
          >
            Delete Role
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
} 