/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useMemo, useState } from 'react';
import { Button, MultiSelect, Stack, Title } from '@mantine/core';
import { useTableColumns, useDeleteColumns } from '../../../../../hooks/useData';
import { IconTrash } from '@tabler/icons-react';
import { ConfirmDeleteColumnsModal } from './ConfirmDeleteColumnsModal';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';

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
  const deleteColumns = useDeleteColumns();

  const columns = columnsResp?.columns || [];

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const columnOptions = useMemo(() => columns.map((c) => ({ value: c.name, label: c.name })), [columns]);

  const handleDeleteColumns = async () => {
    if (selectedColumns.length === 0) return;
    await deleteColumns.mutateAsync({ tableName, body: { columns: selectedColumns } });
    setSelectedColumns([]);
    setConfirmOpen(false);
    onClose();
  };

  return (
    <>
      <ModalWrapper
        opened={open}
        onClose={onClose}
        title={`Manage ${displayName || tableName}`}
        size="80%"
        customActions={
          <Button
            leftSection={<IconTrash size={16} />}
            color="red"
            variant="light"
            disabled={selectedColumns.length === 0}
            onClick={() => setConfirmOpen(true)}
          >
            Delete Selected Columns
          </Button>
        }
        onCancel={onClose}
      >
        <Stack>
          <Title order={5}>Delete columns</Title>
          <MultiSelect
            data={columnOptions}
            value={selectedColumns}
            onChange={setSelectedColumns}
            searchable
            clearable
            placeholder="Pick columns to delete"
          />
        </Stack>
      </ModalWrapper>
      <ConfirmDeleteColumnsModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        tableDisplayName={`Table #${formId}`}
        columns={selectedColumns}
        onConfirm={handleDeleteColumns}
        loading={deleteColumns.isPending}
      />
    </>
  );
}
