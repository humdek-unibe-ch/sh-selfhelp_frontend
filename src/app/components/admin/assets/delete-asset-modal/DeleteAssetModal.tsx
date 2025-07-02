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

interface IDeleteAssetModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  assetName: string;
  isLoading?: boolean;
}

export function DeleteAssetModal({
  opened,
  onClose,
  onConfirm,
  assetName,
  isLoading = false,
}: IDeleteAssetModalProps) {
  const [confirmName, setConfirmName] = useState('');

  const handleClose = () => {
    setConfirmName('');
    onClose();
  };

  const handleConfirm = () => {
    if (confirmName === assetName) {
      onConfirm();
      setConfirmName('');
    }
  };

  const isValidName = confirmName === assetName;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconAlertTriangle size={20} color="red" />
          <Text size="lg" fw={600} c="red">
            Delete Asset
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
            <strong>Warning:</strong> This action cannot be undone. The asset file will be permanently deleted from the server.
          </Text>
        </Alert>

        <div>
          <Text size="sm" mb="xs">
            You are about to delete the asset: <strong>{assetName}</strong>
          </Text>
          <Text size="sm" c="dimmed">
            To confirm deletion, please type the asset file name below:
          </Text>
        </div>

        <TextInput
          label="Confirm Asset Name"
          placeholder={assetName}
          value={confirmName}
          onChange={(e) => setConfirmName(e.currentTarget.value)}
          error={confirmName && !isValidName ? 'Asset name does not match' : null}
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
            Delete Asset
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
} 