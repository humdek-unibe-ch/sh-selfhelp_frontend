"use client";

import { useState } from 'react';
import { Alert, Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useDataTables, useDeleteTable, DATA_QUERY_KEYS } from '../../../../../hooks/useData';

interface IDeleteDataTableModalProps {
  open: boolean;
  onClose: () => void;
  formId: number;
}

export function DeleteDataTableModal({ open, onClose, formId }: IDeleteDataTableModalProps) {
  const { data } = useDataTables();
  const [confirmText, setConfirmText] = useState('');
  const deleteTable = useDeleteTable();

  const table = data?.dataTables.find((t) => t.id === formId);
  const displayName = table?.displayName || table?.name || String(formId);

  const handleDelete = async () => {
    await deleteTable.mutateAsync({ tableName: String(table?.name ?? formId) });
    onClose();
  };

  const disabled = confirmText !== displayName;

  return (
    <Modal opened={open} onClose={onClose} title={`Delete "${displayName}"`} size="lg">
      <Stack>
        <Alert variant="light" color="red" icon={<IconAlertTriangle />}>This action will permanently delete the entire data table. This cannot be undone.</Alert>
        <Text>Type the display name to confirm: <b>{displayName}</b></Text>
        <TextInput value={confirmText} onChange={(e) => setConfirmText(e.currentTarget.value)} placeholder={displayName} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="red" disabled={disabled} loading={deleteTable.isPending} onClick={handleDelete}>Delete Table</Button>
        </Group>
      </Stack>
    </Modal>
  );
}






