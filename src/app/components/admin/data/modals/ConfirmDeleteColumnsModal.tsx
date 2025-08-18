"use client";

import { useState } from 'react';
import { Alert, Button, Group, List, Modal, Stack, Text, TextInput, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react';

interface IConfirmDeleteColumnsModalProps {
  open: boolean;
  onClose: () => void;
  tableDisplayName: string;
  columns: string[];
  onConfirm: () => Promise<void> | void;
}

export function ConfirmDeleteColumnsModal({ open, onClose, tableDisplayName, columns, onConfirm }: IConfirmDeleteColumnsModalProps) {
  const [confirm, setConfirm] = useState('');
  const disabled = confirm !== tableDisplayName || columns.length === 0;

  const handleConfirm = async () => {
    await onConfirm();
    setConfirm('');
    onClose();
  };

  return (
    <Modal opened={open} onClose={onClose} title={`Delete ${columns.length} column(s)`} size="lg" centered>
      <Stack>
        <Alert variant="light" color="red" icon={<IconAlertTriangle />}>This will delete the selected columns from &quot;{tableDisplayName}&quot;. Type the table name to confirm.</Alert>
        <List
          spacing="xs"
          icon={<ThemeIcon size={16} radius="xl" color="gray"><IconCircleCheck size={12} /></ThemeIcon>}
        >
          {columns.map((c) => (
            <List.Item key={c}>{c}</List.Item>
          ))}
        </List>
        <TextInput value={confirm} onChange={(e) => setConfirm(e.currentTarget.value)} placeholder={tableDisplayName} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="red" disabled={disabled} onClick={handleConfirm} loading={false}>Delete Columns</Button>
        </Group>
      </Stack>
    </Modal>
  );
}



