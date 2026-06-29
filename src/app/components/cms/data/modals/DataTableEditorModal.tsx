/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useMemo, useState } from 'react';
import { ActionIcon, Button, Divider, Group, MultiSelect, Stack, Text, TextInput, Title, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTableColumns, useDeleteColumns, useUpdateColumnDisplayName } from '../../../../../hooks/useData';
import { IconDeviceFloppy, IconTrash } from '@tabler/icons-react';
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
  const updateColumnLabel = useUpdateColumnDisplayName();

  const columns = useMemo(() => columnsResp?.columns || [], [columnsResp?.columns]);
  // Only columns with a real storage key can be selected/relabelled.
  const keyedColumns = useMemo(
    () => columns.filter((c): c is { id: number; fieldKey: string; displayName: string | null } => !!c.fieldKey),
    [columns],
  );

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Overlay of user-typed labels keyed by field_key. The displayed value is the
  // edit when present, otherwise the loaded display_name — so no effect is
  // needed to seed state from the columns query.
  const [editedLabels, setEditedLabels] = useState<Record<string, string>>({});

  // Delete options: the value is the immutable field_key, the label is the
  // curated display_name (falling back to the key).
  const columnOptions = useMemo(
    () => keyedColumns.map((c) => ({ value: c.fieldKey, label: c.displayName && c.displayName !== '' ? `${c.displayName} (${c.fieldKey})` : c.fieldKey })),
    [keyedColumns],
  );

  const handleDeleteColumns = async () => {
    if (selectedColumns.length === 0) return;
    await deleteColumns.mutateAsync({ tableName, body: { columns: selectedColumns } });
    setSelectedColumns([]);
    setConfirmOpen(false);
    onClose();
  };

  const handleSaveLabel = async (fieldKey: string, currentDisplayName: string | null) => {
    const draft = (editedLabels[fieldKey] ?? currentDisplayName ?? '').trim();
    await updateColumnLabel.mutateAsync({ tableName, body: { fieldKey, displayName: draft === '' ? null : draft } });
    // Drop the local edit so the input reflects the refetched server value.
    setEditedLabels((d) => {
      const next = { ...d };
      delete next[fieldKey];
      return next;
    });
    notifications.show({ title: 'Label updated', message: `Saved label for "${fieldKey}"`, color: 'green' });
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
          <div>
            <Title order={5}>Column labels</Title>
            <Text size="xs" c="dimmed" mb="xs">
              Rename the human-facing label without changing the stable storage key.
              Stored data, exports and interpolation tokens keep using the field key.
            </Text>
            {keyedColumns.length === 0 ? (
              <Text size="sm" c="dimmed">No columns yet.</Text>
            ) : (
              <Stack gap="xs">
                {keyedColumns.map((col) => (
                  <Group key={col.id} wrap="nowrap" gap="xs" align="flex-end">
                    <Tooltip label="Immutable storage key (field_key)">
                      <Text size="sm" ff="monospace" w={200} style={{ flexShrink: 0 }} truncate>
                        {col.fieldKey}
                      </Text>
                    </Tooltip>
                    <TextInput
                      style={{ flex: 1 }}
                      size="xs"
                      aria-label={`Display label for column ${col.fieldKey}`}
                      placeholder={col.fieldKey}
                      value={editedLabels[col.fieldKey] ?? col.displayName ?? ''}
                      onChange={(e) => {
                        const v = e.currentTarget.value;
                        setEditedLabels((d) => ({ ...d, [col.fieldKey]: v }));
                      }}
                    />
                    <Tooltip label="Save label">
                      <ActionIcon
                        variant="light"
                        aria-label={`Save label for column ${col.fieldKey}`}
                        loading={updateColumnLabel.isPending}
                        onClick={() => void handleSaveLabel(col.fieldKey, col.displayName)}
                      >
                        <IconDeviceFloppy size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                ))}
              </Stack>
            )}
          </div>

          <Divider />

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
