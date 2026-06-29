/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useMemo, useState } from 'react';
import { ActionIcon, Badge, Button, Divider, Group, MultiSelect, Stack, Text, TextInput, Title, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTableColumns, useDeleteColumns, useUpdateColumnDisplayName, useUpdateTableDisplayName } from '../../../../../hooks/useData';
import { IconArrowBackUp, IconDeviceFloppy, IconTrash } from '@tabler/icons-react';
import { ConfirmDeleteColumnsModal } from './ConfirmDeleteColumnsModal';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';

interface IDataTableEditorModalProps {
  open: boolean;
  onClose: () => void;
  formId: number;
  tableName: string;
  displayName?: string;
  /** Whether the table label is admin-locked (provenance `manual`, issue #56). */
  locked?: boolean;
}

export function DataTableEditorModal({ open, onClose, formId, tableName, displayName, locked = false }: IDataTableEditorModalProps) {
  // Load columns only when modal is opened
  const { data: columnsResp } = useTableColumns(open ? tableName : undefined as unknown as string);
  const deleteColumns = useDeleteColumns();
  const updateColumnLabel = useUpdateColumnDisplayName();
  const updateTableLabel = useUpdateTableDisplayName();

  const columns = useMemo(() => columnsResp?.columns || [], [columnsResp?.columns]);
  // Only columns with a real storage key can be selected/relabelled.
  const keyedColumns = useMemo(
    () => columns.filter((c): c is { id: number; fieldKey: string; displayName: string | null; locked: boolean } => !!c.fieldKey),
    [columns],
  );

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Table-label editor state. `tableLocked` tracks the lock live within the open
  // modal (the `locked` prop only refreshes on the next tables-list refetch).
  const [tableLabelDraft, setTableLabelDraft] = useState<string>(displayName ?? '');
  const [tableLocked, setTableLocked] = useState<boolean>(locked);
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

  // Reset a column to its automatic label (clears the manual lock). External
  // (SurveyJS) keys re-derive to null and pick the label back up on next write.
  const handleResetColumnLabel = async (fieldKey: string) => {
    await updateColumnLabel.mutateAsync({ tableName, body: { fieldKey, displayName: null } });
    setEditedLabels((d) => {
      const next = { ...d };
      delete next[fieldKey];
      return next;
    });
    notifications.show({ title: 'Label reset', message: `"${fieldKey}" follows its automatic label again`, color: 'green' });
  };

  const handleSaveTableLabel = async () => {
    const draft = tableLabelDraft.trim();
    await updateTableLabel.mutateAsync({ tableName, body: { displayName: draft === '' ? null : draft } });
    setTableLocked(draft !== '');
    notifications.show({
      title: draft === '' ? 'Table label reset' : 'Table label updated',
      message: draft === '' ? 'The table follows the form display name again' : `Saved label "${draft}"`,
      color: 'green',
    });
  };

  const handleResetTableLabel = async () => {
    await updateTableLabel.mutateAsync({ tableName, body: { displayName: null } });
    setTableLabelDraft('');
    setTableLocked(false);
    notifications.show({ title: 'Table label reset', message: 'The table follows the form display name again', color: 'green' });
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
            <Group gap="xs" mb={4}>
              <Title order={5}>Table label</Title>
              <Badge color={tableLocked ? 'orange' : 'gray'} variant="light" size="sm">
                {tableLocked ? 'Locked (manual)' : 'Auto'}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" mb="xs">
              Rename the table&apos;s human label. A manual rename locks it so the form&apos;s
              display name no longer overwrites it on save. Reset to follow the form again.
            </Text>
            <Group wrap="nowrap" gap="xs" align="flex-end">
              <TextInput
                style={{ flex: 1 }}
                size="xs"
                aria-label="Data table display label"
                placeholder={tableName}
                value={tableLabelDraft}
                onChange={(e) => setTableLabelDraft(e.currentTarget.value)}
              />
              <Tooltip label="Save table label (locks it)">
                <ActionIcon
                  variant="light"
                  aria-label="Save table label"
                  loading={updateTableLabel.isPending}
                  onClick={() => void handleSaveTableLabel()}
                >
                  <IconDeviceFloppy size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Reset to auto (follow form display name)">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  aria-label="Reset table label to auto"
                  disabled={!tableLocked}
                  loading={updateTableLabel.isPending}
                  onClick={() => void handleResetTableLabel()}
                >
                  <IconArrowBackUp size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </div>

          <Divider />

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
                      <Text size="sm" ff="monospace" w={180} style={{ flexShrink: 0 }} truncate>
                        {col.fieldKey}
                      </Text>
                    </Tooltip>
                    <Badge
                      color={col.locked ? 'orange' : 'gray'}
                      variant="light"
                      size="sm"
                      style={{ flexShrink: 0, width: 64 }}
                    >
                      {col.locked ? 'Manual' : 'Auto'}
                    </Badge>
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
                    <Tooltip label="Save label (locks it)">
                      <ActionIcon
                        variant="light"
                        aria-label={`Save label for column ${col.fieldKey}`}
                        loading={updateColumnLabel.isPending}
                        onClick={() => void handleSaveLabel(col.fieldKey, col.displayName)}
                      >
                        <IconDeviceFloppy size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Reset to auto (follow the form input name)">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        aria-label={`Reset label for column ${col.fieldKey} to auto`}
                        disabled={!col.locked}
                        loading={updateColumnLabel.isPending}
                        onClick={() => void handleResetColumnLabel(col.fieldKey)}
                      >
                        <IconArrowBackUp size={16} />
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
