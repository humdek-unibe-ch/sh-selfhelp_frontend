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

interface IDeleteGroupModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  groupName: string;
  isLoading?: boolean;
}

export function DeleteGroupModal({
  opened,
  onClose,
  onConfirm,
  groupName,
  isLoading = false,
}: IDeleteGroupModalProps) {
  const [confirmName, setConfirmName] = useState('');

  const handleClose = () => {
    setConfirmName('');
    onClose();
  };

  const handleConfirm = () => {
    if (confirmName === groupName) {
      onConfirm();
      setConfirmName('');
    }
  };

  const isValidName = confirmName === groupName;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconAlertTriangle size={20} color="red" />
          <Text size="lg" fw={600} c="red">
            Delete Group
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
            <strong>Warning:</strong> This action cannot be undone. All data related to this group will be permanently deleted.
          </Text>
        </Alert>

        <div>
          <Text size="sm" mb="xs">
            You are about to delete the group: <strong>{groupName}</strong>
          </Text>
          <Text size="sm" c="dimmed">
            To confirm deletion, please type the group name below:
          </Text>
        </div>

        <TextInput
          label="Confirm Group Name"
          placeholder={groupName}
          value={confirmName}
          onChange={(e) => setConfirmName(e.currentTarget.value)}
          error={confirmName && !isValidName ? 'Group name does not match' : null}
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
            Delete Group
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
} 