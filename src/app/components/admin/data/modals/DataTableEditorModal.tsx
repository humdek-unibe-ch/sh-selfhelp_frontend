"use client";

import { useMemo, useState } from 'react';
import { Button, Divider, Group, Modal, MultiSelect, Stack, Title } from '@mantine/core';
import { useTableColumns, useDeleteColumns } from '../../../../../hooks/useData';
import { IconTrash } from '@tabler/icons-react';
import { ConfirmDeleteColumnsModal } from './ConfirmDeleteColumnsModal';

interface IDataTableEditorModalProps {
  open: boolean;
  onClose: () => void;
  formId: number;
  tableName: string;
  displayName?: string;
}

export function DataTableEditorModal({ open, onClose, formId, tableName, displayName }: IDataTableEditorModalProps) {
  // Load columns only when modal is opened
  const { data: columnsResp } = useTableColumns(open ? tableName : undefined as unknown as string);
  // No records list here anymore; removed heavy rows fetch to reduce resource usage
  const deleteColumns = useDeleteColumns();

  const columns = columnsResp?.columns || [];
  // No rows here; row deletion moved to table row actions

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const columnOptions = useMemo(() => columns.map((c) => ({ value: c.name, label: c.name })), [columns]);

  const handleDeleteColumns = async () => {
    if (selectedColumns.length === 0) return;
    await deleteColumns.mutateAsync({ tableName, body: { columns: selectedColumns } });
    setSelectedColumns([]);
  };

  return (
    <>
      <Modal opened={open} onClose={onClose} title={<Title order={4} component="div">Manage {displayName || tableName}</Title>} size="80%">
        <Stack>
          <Title order={5}>Delete columns</Title>
          <MultiSelect data={columnOptions} value={selectedColumns} onChange={setSelectedColumns} searchable clearable placeholder="Pick columns to delete" />
          <Group justify="flex-end">
            <Button leftSection={<IconTrash size={16} />} color="red" disabled={selectedColumns.length === 0} onClick={() => setConfirmOpen(true)}>Delete Selected Columns</Button>
          </Group>

          {/* Records management moved to table itself */}
        </Stack>
      </Modal>
      <ConfirmDeleteColumnsModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        tableDisplayName={`Table #${formId}`}
        columns={selectedColumns}
        onConfirm={handleDeleteColumns}
      />
    </>
  );
}


