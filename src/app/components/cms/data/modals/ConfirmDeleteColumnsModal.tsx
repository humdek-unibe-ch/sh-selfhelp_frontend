/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState } from 'react';
import { Alert, List, Stack, TextInput, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';

interface IConfirmDeleteColumnsModalProps {
  open: boolean;
  onClose: () => void;
  tableDisplayName: string;
  columns: string[];
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}

export function ConfirmDeleteColumnsModal({ open, onClose, tableDisplayName, columns, onConfirm, loading = false }: IConfirmDeleteColumnsModalProps) {
  const [confirm, setConfirm] = useState('');
  const disabled = confirm !== tableDisplayName || columns.length === 0;

  const handleConfirm = async () => {
    await onConfirm();
    setConfirm('');
  };

  return (
    <ModalWrapper
      opened={open}
      onClose={onClose}
      title={`Delete ${columns.length} column(s)`}
      onDelete={handleConfirm}
      onCancel={onClose}
      deleteLabel="Delete Columns"
      deleteVariant="filled"
      isLoading={loading}
      disabled={disabled}
    >
      <Stack>
        <Alert variant="light" color="red" icon={<IconAlertTriangle />}>
          This will delete the selected columns from &quot;{tableDisplayName}&quot;. Type the table name to confirm.
        </Alert>
        <List
          spacing="xs"
          icon={<ThemeIcon size={16} radius="xl" color="gray"><IconCircleCheck size={12} /></ThemeIcon>}
        >
          {columns.map((c) => (
            <List.Item key={c}>{c}</List.Item>
          ))}
        </List>
        <TextInput value={confirm} onChange={(e) => setConfirm(e.currentTarget.value)} placeholder={tableDisplayName} />
      </Stack>
    </ModalWrapper>
  );
}
