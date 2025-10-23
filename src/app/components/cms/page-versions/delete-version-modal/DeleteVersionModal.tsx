'use client';

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
import { IPageVersion } from '../../../../../types/responses/admin/page-version.types';

interface IDeleteVersionModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  version: IPageVersion | null;
  isLoading?: boolean;
}

export function DeleteVersionModal({
  opened,
  onClose,
  onConfirm,
  version,
  isLoading = false,
}: IDeleteVersionModalProps) {
  const [confirmText, setConfirmText] = useState('');

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  const handleConfirm = () => {
    if (confirmText === version?.version_name || confirmText === `Version ${version?.version_number}`) {
      onConfirm();
      setConfirmText('');
    }
  };

  const expectedText = version?.version_name || `Version ${version?.version_number}`;
  const isValidConfirmation = confirmText === expectedText;

  if (!version) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconAlertTriangle size={20} color="red" />
          <Text size="lg" fw={600} c="red">
            Delete Version
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
            <strong>Warning:</strong> This action cannot be undone. The version and all its data will be permanently deleted.
          </Text>
        </Alert>

        <div>
          <Text size="sm" mb="xs">
            You are about to delete: <strong>{expectedText}</strong>
          </Text>
          <Text size="sm" c="dimmed">
            To confirm deletion, please type the version name below:
          </Text>
        </div>

        <TextInput
          label="Confirm Version Name"
          placeholder={expectedText}
          value={confirmText}
          onChange={(e) => setConfirmText(e.currentTarget.value)}
          error={confirmText && !isValidConfirmation ? 'Version name does not match' : null}
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={handleConfirm}
            disabled={!isValidConfirmation || isLoading}
            loading={isLoading}
          >
            Delete Version
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
