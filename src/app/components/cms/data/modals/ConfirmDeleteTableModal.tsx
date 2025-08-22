"use client";

import { useState } from 'react';
import { Alert, Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface IConfirmDeleteTableModalProps {
  open: boolean;
  onClose: () => void;
  displayName: string;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}

export function ConfirmDeleteTableModal({ open, onClose, displayName, onConfirm, loading = false }: IConfirmDeleteTableModalProps) {
  const [confirm, setConfirm] = useState("");
  const disabled = confirm !== displayName;

  const handleConfirm = async () => {
    await onConfirm();
    setConfirm("");
    onClose();
  };

  return (
    <Modal opened={open} onClose={onClose} title={`Delete Table`} size="lg" centered>
      <Stack>
        <Alert variant="light" color="red" icon={<IconAlertTriangle />}
          title="This action will permanently delete the data table">
          <Text size="sm">
            You are about to permanently delete the data table <Text span fw={600}>{displayName}</Text> and all of its data. This action cannot be undone.
          </Text>
          <Text size="sm" mt="xs">
            To confirm, type the table display name exactly: <Text span fw={600}>{displayName}</Text>
          </Text>
        </Alert>
        <TextInput value={confirm} onChange={(e) => setConfirm(e.currentTarget.value)} placeholder={displayName} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="red" disabled={disabled} loading={loading} onClick={handleConfirm}>Delete Table</Button>
        </Group>
      </Stack>
    </Modal>
  );
}


