"use client";

import { useState } from 'react';
import { Modal, Stack, TextInput, Button, Group, Text, Alert, LoadingOverlay } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface IDeleteActionModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionName: string;
  isLoading?: boolean;
}

export function DeleteActionModal({ opened, onClose, onConfirm, actionName, isLoading = false }: IDeleteActionModalProps) {
  const [confirmName, setConfirmName] = useState('');

  const handleClose = () => {
    setConfirmName('');
    onClose();
  };

  const handleConfirm = () => {
    if (confirmName === actionName) {
      onConfirm();
      setConfirmName('');
    }
  };

  const isValidName = confirmName === actionName;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconAlertTriangle size={20} color="red" />
          <Text size="lg" fw={600} c="red">Delete Action</Text>
        </Group>
      }
      centered
      size="md"
    >
      <LoadingOverlay visible={isLoading} />
      <Stack gap="md">
        <Alert color="red" variant="light">
          Deleting an action is permanent. Jobs associated to this action will no longer be scheduled.
        </Alert>
        <div>
          <Text size="sm" mb="xs">You are about to delete the action: <strong>{actionName}</strong></Text>
          <Text size="sm" c="dimmed">To confirm deletion, please type the action name below:</Text>
        </div>
        <TextInput
          label="Confirm Action Name"
          placeholder={actionName}
          value={confirmName}
          onChange={(e) => setConfirmName(e.currentTarget.value)}
          error={confirmName && !isValidName ? 'Action name does not match' : null}
        />
        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button color="red" onClick={handleConfirm} disabled={!isValidName || isLoading} loading={isLoading}>Delete Action</Button>
        </Group>
      </Stack>
    </Modal>
  );
}


